const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const axios = require('axios');

const folderPathCreditCardsTariffs = './src/data/pdfs';
const folderPathLoan = './src/data/pdfs/loan-t-bank'
const folderSberPathLoan = './src/data/pdfs/sber'

const exampleFileName = 'example.txt'

async function extractTextFromPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    try {
        const data = await pdf(dataBuffer);
        return data.text;
    } catch (e) {
        console.warn(e)
    }
}

async function sendToLMAPI(text, example) {
    try {
        const response = await axios.post('http://172.19.96.1:1234/v1/chat/completions', {
            "model": "qwen2.5-coder-7b-instruct",
            "temperature": 0.7,
            "max_tokens": -1,
            "stream": false,
            "messages": [
                { "role": "system", "content": "Всегда отвечай в виде JSON формате :" + example },
                { "role": "user", "content":  "Все поля в JSON нужно заполнить из PDF файла ```PDF \n"+text+"```" }
            ],
        }, {
            headers: {
                'Content-Type': 'application/json',
            }
        });



        return response.data;
    } catch (error) {
        console.error('Ошибка при отправке запроса к API:', error);
        return null;
    }
}

async function sendSberToLMAPI(text, example) {
    try {
        const response = await axios.post('http://172.19.96.1:1234/v1/chat/completions', {
            "model": "qwen2.5-coder-7b-instruct",
            "temperature": 1,
            "max_tokens": -1,
            "stream": false,
            "messages": [
                { "role": "system", "content": "Всегда отвечай в виде JSON формате вот пример из другого банка: " + example },
                { "role": "user", "content":  "Выведи массив всех кредитных продуктов в JSON проанализируй этот текст :\n"+text+" верни массив протуктов в формате: " + example }
            ],
        }, {
            headers: {
                'Content-Type': 'application/json',
            }
        });



        return response.data;
    } catch (error) {
        console.error('Ошибка при отправке запроса к API:', error);
        return null;
    }
}


async function processPDFsInFolder(folderPath,exampleFileName, sendToLMAPI) {
    console.log(folderPath, ' start');
    const files = fs.readdirSync(folderPath);
    const example = fs.readFileSync(path.join(folderPath, exampleFileName))
    const results = [];

    for (const file of files) {
        if (path.extname(file).toLowerCase() === '.pdf') {
            const filePath = path.join(folderPath, file);
            console.log('|--',file)
            const text = await extractTextFromPDF(filePath);
            const jsonData = await sendToLMAPI(text, example);
            const result = JSON.parse(jsonData.choices[0].message.content.replace('```json','').replace('```',''))
            fs.writeFileSync(path.join(folderPath, file.replace('.pdf','.json')), JSON.stringify(result, null, 2));
        }
    }
    console.log(folderPath, ' finish');
    
}

(async function () {
    // await processPDFsInFolder(folderPathCreditCardsTariffs, exampleFileName, sendToLMAPI);
    // await processPDFsInFolder(folderPathLoan, exampleFileName, sendToLMAPI);
    await processPDFsInFolder(folderSberPathLoan, exampleFileName, sendSberToLMAPI);
})()
