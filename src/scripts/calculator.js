/**
 * Универсальный калькулятор для банковских продуктов
 * 
 * Этот скрипт предоставляет калькуляторы для различных типов банковских продуктов:
 * - Кредиты
 * - Вклады
 * - Ипотека
 * - Автокредиты
 * - Инвестиции
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Калькулятор для кредитов
 * @param {number} loanAmount - Сумма кредита
 * @param {number} interestRate - Процентная ставка (в процентах)
 * @param {number} termMonths - Срок кредита в месяцах
 * @param {string} paymentType - Тип платежа ('annuity' или 'differentiated')
 */
function calculateCredit(loanAmount, interestRate, termMonths, paymentType = 'annuity') {
  const monthlyRate = interestRate / 100 / 12;
  
  if (paymentType === 'annuity') {
    // Аннуитетный платеж
    const annuityCoefficient = (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                              (Math.pow(1 + monthlyRate, termMonths) - 1);
    const monthlyPayment = loanAmount * annuityCoefficient;
    const totalPayment = monthlyPayment * termMonths;
    const overpayment = totalPayment - loanAmount;
    
    return {
      type: 'credit',
      monthlyPayment: parseFloat(monthlyPayment.toFixed(2)),
      totalPayment: parseFloat(totalPayment.toFixed(2)),
      overpayment: parseFloat(overpayment.toFixed(2)),
      effectiveRate: parseFloat(((totalPayment / loanAmount - 1) * 100).toFixed(2))
    };
  } else {
    // Дифференцированный платеж
    const payments = [];
    let remainingDebt = loanAmount;
    let totalPayment = 0;
    
    for (let month = 1; month <= termMonths; month++) {
      const principalPayment = loanAmount / termMonths;
      const interestPayment = remainingDebt * monthlyRate;
      const monthlyPayment = principalPayment + interestPayment;
      
      payments.push({
        month: month,
        payment: parseFloat(monthlyPayment.toFixed(2)),
        principal: parseFloat(principalPayment.toFixed(2)),
        interest: parseFloat(interestPayment.toFixed(2)),
        remaining: parseFloat(remainingDebt.toFixed(2))
      });
      
      remainingDebt -= principalPayment;
      totalPayment += monthlyPayment;
    }
    
    const overpayment = totalPayment - loanAmount;
    
    return {
      type: 'credit',
      paymentSchedule: payments,
      totalPayment: parseFloat(totalPayment.toFixed(2)),
      overpayment: parseFloat(overpayment.toFixed(2)),
      effectiveRate: parseFloat(((totalPayment / loanAmount - 1) * 100).toFixed(2))
    };
  }
}

/**
 * Калькулятор для вкладов
 * @param {number} depositAmount - Сумма вклада
 * @param {number} interestRate - Процентная ставка (в процентах)
 * @param {number} termMonths - Срок вклада в месяцах
 * @param {boolean} capitalization - Капитализация процентов
 * @param {number} replenishment - Пополнение вклада (ежемесячно)
 */
function calculateDeposit(depositAmount, interestRate, termMonths, capitalization = true, replenishment = 0) {
  if (capitalization) {
    // С капитализацией
    let totalAmount = depositAmount;
    let totalInterest = 0;
    
    for (let month = 1; month <= termMonths; month++) {
      const monthlyInterest = totalAmount * (interestRate / 100 / 12);
      totalInterest += monthlyInterest;
      totalAmount += monthlyInterest + replenishment;
    }
    
    const effectiveRate = parseFloat(((totalAmount - depositAmount) / depositAmount / (termMonths / 12)) * 100).toFixed(2);
    
    return {
      type: 'deposit',
      initialAmount: depositAmount,
      finalAmount: parseFloat(totalAmount.toFixed(2)),
      totalInterest: parseFloat(totalInterest.toFixed(2)),
      effectiveRate: parseFloat(effectiveRate)
    };
  } else {
    // Без капитализации
    const monthlyInterest = depositAmount * (interestRate / 100 / 12);
    const totalInterest = monthlyInterest * termMonths + (replenishment * (termMonths * (termMonths + 1) / 2) * (interestRate / 100 / 12));
    const finalAmount = depositAmount + totalInterest + (replenishment * termMonths);
    
    const effectiveRate = parseFloat(((finalAmount - depositAmount) / depositAmount / (termMonths / 12)) * 100).toFixed(2);
    
    return {
      type: 'deposit',
      initialAmount: depositAmount,
      finalAmount: parseFloat(finalAmount.toFixed(2)),
      totalInterest: parseFloat(totalInterest.toFixed(2)),
      monthlyInterest: parseFloat(monthlyInterest.toFixed(2)),
      effectiveRate: parseFloat(effectiveRate)
    };
  }
}

/**
 * Калькулятор для ипотеки
 * @param {number} propertyCost - Стоимость недвижимости
 * @param {number} downPayment - Первоначальный взнос
 * @param {number} interestRate - Процентная ставка (в процентах)
 * @param {number} termYears - Срок кредита в годах
 */
function calculateMortgage(propertyCost, downPayment, interestRate, termYears) {
  const loanAmount = propertyCost - downPayment;
  const termMonths = termYears * 12;
  
  if (loanAmount <= 0) {
    throw new Error('Первоначальный взнос не может быть больше или равен стоимости недвижимости');
  }
  
  const monthlyRate = interestRate / 100 / 12;
  const annuityCoefficient = (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                            (Math.pow(1 + monthlyRate, termMonths) - 1);
  const monthlyPayment = loanAmount * annuityCoefficient;
  const totalPayment = monthlyPayment * termMonths;
  const overpayment = totalPayment - loanAmount;
  const ltv = parseFloat(((loanAmount / propertyCost) * 100).toFixed(2)); // Loan-to-Value
  
  return {
    type: 'mortgage',
    propertyCost: propertyCost,
    downPayment: downPayment,
    loanAmount: loanAmount,
    monthlyPayment: parseFloat(monthlyPayment.toFixed(2)),
    totalPayment: parseFloat(totalPayment.toFixed(2)),
    overpayment: parseFloat(overpayment.toFixed(2)),
    ltv: ltv,
    effectiveRate: parseFloat(((totalPayment / loanAmount - 1) * 100 / termYears).toFixed(2))
  };
}

/**
 * Калькулятор для автокредита
 * @param {number} carPrice - Стоимость автомобиля
 * @param {number} downPayment - Первоначальный взнос
 * @param {number} interestRate - Процентная ставка (в процентах)
 * @param {number} termMonths - Срок кредита в месяцах
 * @param {boolean} insuranceIncluded - Учтен ли страховой полис в стоимости
 */
function calculateAutoLoan(carPrice, downPayment, interestRate, termMonths, insuranceIncluded = false) {
  const loanAmount = carPrice - downPayment;
  const monthlyRate = interestRate / 100 / 12;
  
  const annuityCoefficient = (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                            (Math.pow(1 + monthlyRate, termMonths) - 1);
  const monthlyPayment = loanAmount * annuityCoefficient;
  const totalPayment = monthlyPayment * termMonths;
  const overpayment = totalPayment - loanAmount;
  
  return {
    type: 'auto-loan',
    carPrice: carPrice,
    downPayment: downPayment,
    loanAmount: loanAmount,
    monthlyPayment: parseFloat(monthlyPayment.toFixed(2)),
    totalPayment: parseFloat(totalPayment.toFixed(2)),
    overpayment: parseFloat(overpayment.toFixed(2)),
    effectiveRate: parseFloat(((totalPayment / loanAmount - 1) * 100).toFixed(2)),
    insuranceIncluded: insuranceIncluded
  };
}

/**
 * Калькулятор для инвестиций
 * @param {number} initialInvestment - Начальная сумма инвестиций
 * @param {number} monthlyAddition - Ежемесячное пополнение
 * @param {number} expectedReturn - Ожидаемая доходность (в процентах годовых)
 * @param {number} investmentPeriod - Срок инвестирования в годах
 */
function calculateInvestment(initialInvestment, monthlyAddition, expectedReturn, investmentPeriod) {
  const monthlyRate = expectedReturn / 100 / 12;
  const totalMonths = investmentPeriod * 12;
  
  let totalAmount = initialInvestment;
  
  for (let month = 1; month <= totalMonths; month++) {
    totalAmount *= (1 + monthlyRate);
    totalAmount += monthlyAddition;
  }
  
  const totalContributions = initialInvestment + (monthlyAddition * totalMonths);
  const totalProfit = totalAmount - totalContributions;
  const roi = parseFloat(((totalProfit / totalContributions) * 100).toFixed(2));
  
  return {
    type: 'investment',
    initialInvestment: initialInvestment,
    totalContributions: parseFloat(totalContributions.toFixed(2)),
    finalAmount: parseFloat(totalAmount.toFixed(2)),
    totalProfit: parseFloat(totalProfit.toFixed(2)),
    roi: roi,
    annualizedReturn: parseFloat(Math.pow(totalAmount / totalContributions, 1 / investmentPeriod) * 100 - 100).toFixed(2)
  };
}

/**
 * Универсальная функция для расчета по типу продукта
 */
function calculateByProductType(productType, params) {
  switch (productType) {
    case 'credits':
    case 'credit-cards':
      return calculateCredit(
        params.loanAmount,
        params.interestRate,
        params.termMonths,
        params.paymentType || 'annuity'
      );
      
    case 'deposits':
    case 'debit-cards':
      return calculateDeposit(
        params.depositAmount,
        params.interestRate,
        params.termMonths,
        params.capitalization !== undefined ? params.capitalization : true,
        params.replenishment || 0
      );
      
    case 'mortgage':
      return calculateMortgage(
        params.propertyCost,
        params.downPayment,
        params.interestRate,
        params.termYears
      );
      
    case 'auto-loans':
      return calculateAutoLoan(
        params.carPrice,
        params.downPayment,
        params.interestRate,
        params.termMonths,
        params.insuranceIncluded
      );
      
    case 'investment-products':
      return calculateInvestment(
        params.initialInvestment,
        params.monthlyAddition,
        params.expectedReturn,
        params.investmentPeriod
      );
      
    default:
      throw new Error(`Тип продукта "${productType}" не поддерживается калькулятором`);
  }
}

/**
 * Функция для получения параметров калькулятора по типу продукта
 */
function getCalculatorParams(productType) {
  const params = {
    common: ['interestRate']
  };
  
  switch (productType) {
    case 'credits':
    case 'credit-cards':
      return {
        ...params,
        required: ['loanAmount', 'termMonths'],
        optional: ['paymentType'],
        description: 'Калькулятор кредита: рассчитывает ежемесячный платеж, переплату и эффективную ставку'
      };
      
    case 'deposits':
    case 'debit-cards':
      return {
        ...params,
        required: ['depositAmount', 'termMonths'],
        optional: ['capitalization', 'replenishment'],
        description: 'Калькулятор вклада: рассчитывает доходность с учетом капитализации и пополнений'
      };
      
    case 'mortgage':
      return {
        ...params,
        required: ['propertyCost', 'downPayment', 'termYears'],
        optional: [],
        description: 'Ипотечный калькулятор: рассчитывает платежи, переплату и LTV'
      };
      
    case 'auto-loans':
      return {
        ...params,
        required: ['carPrice', 'downPayment', 'termMonths'],
        optional: ['insuranceIncluded'],
        description: 'Автокредитный калькулятор: рассчитывает платежи и переплату по автокредиту'
      };
      
    case 'investment-products':
      return {
        ...params,
        required: ['initialInvestment', 'expectedReturn', 'investmentPeriod'],
        optional: ['monthlyAddition'],
        description: 'Инвестиционный калькулятор: рассчитывает доходность инвестиций с учетом регулярных пополнений'
      };
      
    default:
      return {
        required: [],
        optional: [],
        description: 'Калькулятор для данного типа продукта не реализован'
      };
  }
}

/**
 * Функция для сохранения результатов расчета
 */
async function saveCalculationResult(result, calculationId = null) {
  if (!calculationId) {
    calculationId = `calculation-${Date.now()}`;
  }
  
  const outputPath = path.join(__dirname, `../data/calculations/${calculationId}.json`);
  
  // Создаем директорию, если она не существует
  const dirPath = path.dirname(outputPath);
  await fs.mkdir(dirPath, { recursive: true });
  
  try {
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2), 'utf8');
    console.log(`Результаты расчета сохранены в ${outputPath}`);
    return calculationId;
  } catch (error) {
    console.error('Ошибка при сохранении результатов расчета:', error.message);
    throw error;
  }
}

/**
 * Основная функция калькулятора
 */
async function runCalculator(productType, params) {
  console.log(`Запуск калькулятора для типа продукта: ${productType}`);
  
  try {
    // Проверяем параметры
    const calculatorParams = getCalculatorParams(productType);
    
    // Выполняем расчет
    const result = calculateByProductType(productType, params);
    
    // Добавляем информацию о типе расчета
    result.calculationType = productType;
    result.calculatedAt = new Date().toISOString();
    
    // Сохраняем результат
    const calculationId = await saveCalculationResult(result);
    
    console.log(`Расчет завершен: ${calculationId}`);
    
    return {
      id: calculationId,
      result: result,
      type: productType
    };
  } catch (error) {
    console.error('Ошибка при выполнении расчета:', error.message);
    throw error;
  }
}

// Если файл запускается напрямую
if (require.main === module) {
  // Пример использования
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Использование: node calculator.js <product_type> <param1> <param2> ...');
    console.log('Пример: node calculator.js credits 500000 12 24');
  } else {
    const productType = args[0];
    const params = args.slice(1).map(Number);
    
    // Пример параметров в зависимости от типа продукта
    let calcParams = {};
    
    switch (productType) {
      case 'credits':
        calcParams = {
          loanAmount: params[0],
          interestRate: params[1],
          termMonths: params[2]
        };
        break;
      case 'deposits':
        calcParams = {
          depositAmount: params[0],
          interestRate: params[1],
          termMonths: params[2]
        };
        break;
      case 'mortgage':
        calcParams = {
          propertyCost: params[0],
          downPayment: params[1],
          interestRate: params[2],
          termYears: params[3]
        };
        break;
      default:
        console.log(`Тип продукта ${productType} не поддерживается примером команды`);
    }
    
    runCalculator(productType, calcParams)
      .then(result => {
        console.log('Расчет завершен:', result.id);
        console.log('Результат:', JSON.stringify(result.result, null, 2));
      })
      .catch(error => {
        console.error('Ошибка при выполнении расчета:', error.message);
      });
  }
}

module.exports = {
  calculateCredit,
  calculateDeposit,
  calculateMortgage,
  calculateAutoLoan,
  calculateInvestment,
  calculateByProductType,
  getCalculatorParams,
  runCalculator,
  saveCalculationResult
};