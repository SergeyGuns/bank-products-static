#!/usr/bin/env node

/**
 * Скрипт для проверки стабильности работы системы сбора данных
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

async function runStabilityTest(iterations = 3, delayBetweenRuns = 5000) {
  console.log(`🔍 Запуск теста стабильности (${iterations} итераций)`);

  const results = [];
  let successes = 0;
  let failures = 0;

  for (let i = 0; i < iterations; i++) {
    console.log(`\n🔄 Итерация ${i + 1}/${iterations}`);
    
    try {
      // Запускаем скрапер как отдельный процесс
      const startTime = Date.now();
      const result = await runScraperOnce();
      const duration = Date.now() - startTime;
      
      result.duration = duration;
      result.iteration = i + 1;
      result.success = true;
      
      results.push(result);
      successes++;
      
      console.log(`  ✅ Успешно завершено за ${duration}мс`);
      
      // Задержка между запусками
      if (i < iterations - 1) {
        console.log(`  ⏳ Задержка ${delayBetweenRuns}мс до следующей итерации...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenRuns));
      }
    } catch (error) {
      const result = {
        iteration: i + 1,
        success: false,
        error: error.message,
        duration: -1
      };
      
      results.push(result);
      failures++;
      
      console.log(`  ❌ Ошибка: ${error.message}`);
    }
  }

  // Анализ результатов
  await analyzeResults(results);
  
  console.log('\n📊 Итоги теста стабильности:');
  console.log(`  - Всего запусков: ${iterations}`);
  console.log(`  - Успешных: ${successes}`);
  console.log(`  - Неудачных: ${failures}`);
  console.log(`  - Стабильность: ${((successes / iterations) * 100).toFixed(2)}%`);
  
  return {
    totalRuns: iterations,
    successfulRuns: successes,
    failedRuns: failures,
    stabilityPercentage: (successes / iterations) * 100,
    results
  };
}

function runScraperOnce() {
  return new Promise((resolve, reject) => {
    // Создаем временный файл для результатов этой итерации
    const tempResultPath = path.join(__dirname, `../data/scraping-results-temp-${Date.now()}.json`);
    
    // Запускаем скрапер
    const scraperProcess = spawn('node', ['bank-scraper.js'], {
      cwd: __dirname,
      env: { ...process.env, NODE_ENV: 'test' }
    });

    let stdout = '';
    let stderr = '';

    scraperProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    scraperProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    scraperProcess.on('close', (code) => {
      if (code === 0) {
        // Проверяем, был ли создан файл с результатами
        fs.access(tempResultPath)
          .then(() => {
            // Читаем результаты для анализа
            fs.readFile(tempResultPath, 'utf8')
              .then(data => {
                try {
                  const parsedData = JSON.parse(data);
                  resolve({
                    exitCode: code,
                    hasResultsFile: true,
                    resultCount: parsedData.results ? parsedData.results.length : 0,
                    scanDate: parsedData.scanDate
                  });
                } catch (parseError) {
                  resolve({
                    exitCode: code,
                    hasResultsFile: true,
                    parseError: parseError.message
                  });
                }
              })
              .catch(readError => {
                resolve({
                  exitCode: code,
                  hasResultsFile: true,
                  readFileError: readError.message
                });
              });
          })
          .catch(() => {
            // Файл не был создан, но процесс завершился успешно
            resolve({
              exitCode: code,
              hasResultsFile: false
            });
          });
      } else {
        reject(new Error(`Процесс завершился с кодом ${code}. Stderr: ${stderr}`));
      }
    });

    scraperProcess.on('error', (error) => {
      reject(error);
    });
  });
}

async function analyzeResults(results) {
  console.log('\n📈 Анализ результатов:');
  
  // Проверяем консистентность результатов
  const successfulResults = results.filter(r => r.success);
  
  if (successfulResults.length > 0) {
    // Анализируем длительность выполнения
    const durations = successfulResults.map(r => r.duration);
    const avgDuration = durations.reduce((sum, dur) => sum + dur, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    
    console.log(`  - Средняя длительность: ${avgDuration.toFixed(0)}мс`);
    console.log(`  - Минимальная длительность: ${minDuration}мс`);
    console.log(`  - Максимальная длительность: ${maxDuration}мс`);
    
    // Проверяем консистентность количества результатов (если доступно)
    const resultCounts = successfulResults
      .filter(r => r.resultCount !== undefined)
      .map(r => r.resultCount);
    
    if (resultCounts.length > 0) {
      const avgResults = resultCounts.reduce((sum, count) => sum + count, 0) / resultCounts.length;
      const minResults = Math.min(...resultCounts);
      const maxResults = Math.max(...resultCounts);
      
      console.log(`  - Среднее количество результатов: ${avgResults.toFixed(1)}`);
      console.log(`  - Минимум результатов: ${minResults}`);
      console.log(`  - Максимум результатов: ${maxResults}`);
      
      if (minResults !== maxResults) {
        console.log(`  ⚠️  Обнаружена вариативность в количестве результатов (разница: ${maxResults - minResults})`);
      }
    }
  }
  
  // Анализируем ошибки, если они были
  const failedResults = results.filter(r => !r.success);
  if (failedResults.length > 0) {
    console.log(`\n❌ Обнаружены ошибки в ${failedResults.length} запусках:`);
    failedResults.forEach((result, index) => {
      console.log(`  ${index + 1}. Итерация ${result.iteration}: ${result.error}`);
    });
  }
}

async function main() {
  try {
    // Проверяем, что скрипт bank-scraper.js существует
    const scraperPath = path.join(__dirname, 'bank-scraper.js');
    await fs.access(scraperPath);
    
    console.log('🧪 Тестирование стабильности системы сбора данных');
    console.log('Этот тест запустит процесс сканирования несколько раз и проанализирует стабильность результатов.\n');
    
    const testResults = await runStabilityTest(3, 3000); // 3 итерации с 3-секундной задержкой
    
    if (testResults.stabilityPercentage === 100) {
      console.log('\n✅ Система показала стабильную работу в течение всех тестов!');
    } else {
      console.log('\n⚠️  Обнаружены проблемы со стабильностью работы системы.');
      console.log('Рекомендуется проанализировать логи и повторить тестирование.');
    }
    
    // Сохраняем результаты теста
    const testReport = {
      timestamp: new Date().toISOString(),
      testName: 'Stability Test Report',
      testConfiguration: {
        iterations: testResults.totalRuns,
        delayBetweenRuns: 3000
      },
      summary: {
        totalRuns: testResults.totalRuns,
        successfulRuns: testResults.successfulRuns,
        failedRuns: testResults.failedRuns,
        stabilityPercentage: testResults.stabilityPercentage
      },
      detailedResults: testResults.results
    };
    
    const reportPath = path.join(__dirname, '../data/stability-test-report.json');
    await fs.writeFile(reportPath, JSON.stringify(testReport, null, 2));
    console.log(`\n📋 Отчет о стабильности сохранен в: ${reportPath}`);
    
  } catch (error) {
    console.error(`❌ Ошибка при выполнении теста стабильности: ${error.message}`);
    process.exit(1);
  }
}

// Запускаем основную функцию
main();