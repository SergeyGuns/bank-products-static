/**
 * Улучшенный скрипт для очистки JSON-файлов от комментариев и других невалидных элементов
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Функция для очистки содержимого JSON-файла от комментариев и других невалидных элементов
 */
function cleanJsonContent(content) {
  // Удаляем строки, содержащие комментарии JavaScript
  let cleaned = content.replace(/\/\/[^\n\r]*/g, '');
  
  // Удаляем многострочные комментарии
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Удаляем строки, содержащие только комментарии или ненужные элементы
  const lines = cleaned.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmedLine = line.trim();
    // Исключаем строки, которые являются комментариями или содержат ненужные элементы
    return !trimmedLine.startsWith('//') && 
           !trimmedLine.includes('// Вклады') && 
           !trimmedLine.includes('// Кредиты') && 
           !trimmedLine.includes('// Ипотека') &&
           !trimmedLine.includes('// Карты') &&
           !trimmedLine.includes('// Отзывы') &&
           !trimmedLine.includes('// Страхование') &&
           !trimmedLine.includes('// Инвестиции') &&
           !trimmedLine.includes('// Накопительные счета') &&
           !trimmedLine.includes('// Обслуживание') &&
           !trimmedLine.includes('// Программы') &&
           !trimmedLine.includes('// Условия') &&
           !trimmedLine.includes('// Требования') &&
           !trimmedLine.includes('// Комиссии') &&
           !trimmedLine.includes('// Параметры') &&
           !trimmedLine.includes('// Особенности') &&
           !trimmedLine.includes('// Преимущества') &&
           !trimmedLine.includes('// Недостатки') &&
           !trimmedLine.includes('// Обзор') &&
           !trimmedLine.includes('// Сравнение') &&
           !trimmedLine.includes('// Рейтинг') &&
           !trimmedLine.includes('// Отзывы клиентов') &&
           !trimmedLine.includes('// Рекомендации') &&
           !trimmedLine.includes('// Ссылки') &&
           !trimmedLine.includes('// Документы') &&
           !trimmedLine.includes('// Контакты') &&
           !trimmedLine.includes('// Адреса') &&
           !trimmedLine.includes('// Время работы') &&
           !trimmedLine.includes('// Телефоны') &&
           !trimmedLine.includes('// Email') &&
           !trimmedLine.includes('// Сайт') &&
           !trimmedLine.includes('// Приложения') &&
           !trimmedLine.includes('// Мобильный банк') &&
           !trimmedLine.includes('// Интернет-банк') &&
           !trimmedLine.includes('// Банкоматы') &&
           !trimmedLine.includes('// Отделения') &&
           !trimmedLine.includes('// Филиалы') &&
           !trimmedLine.includes('// Офисы') &&
           !trimmedLine.includes('// Регионы') &&
           !trimmedLine.includes('// Города') &&
           !trimmedLine.includes('// Страны') &&
           !trimmedLine.includes('// Местоположение') &&
           !trimmedLine.includes('// Карта') &&
           !trimmedLine.includes('// Навигация') &&
           !trimmedLine.includes('// Поиск') &&
           !trimmedLine.includes('// Фильтры') &&
           !trimmedLine.includes('// Сортировка') &&
           !trimmedLine.includes('// Страница') &&
           !trimmedLine.includes('// Навигация по сайту') &&
           !trimmedLine.includes('// Подвал') &&
           !trimmedLine.includes('// Шапка') &&
           !trimmedLine.includes('// Меню') &&
           !trimmedLine.includes('// Боковая панель') &&
           !trimmedLine.includes('// Реклама') &&
           !trimmedLine.includes('// Спонсоры') &&
           !trimmedLine.includes('// Партнеры') &&
           !trimmedLine.includes('// Рекламные блоки') &&
           !trimmedLine.includes('// Баннеры') &&
           !trimmedLine.includes('// Рекламные предложения') &&
           !trimmedLine.includes('// Спецпредложения') &&
           !trimmedLine.includes('// Акции') &&
           !trimmedLine.includes('// Скидки') &&
           !trimmedLine.includes('// Бонусы') &&
           !trimmedLine.includes('// Программы лояльности') &&
           !trimmedLine.includes('// Кэшбэк') &&
           !trimmedLine.includes('// Карты рассрочки') &&
           !trimmedLine.includes('// Кредитные рейтинги') &&
           !trimmedLine.includes('// Финансовая грамотность') &&
           !trimmedLine.includes('// Образование') &&
           !trimmedLine.includes('// Статьи') &&
           !trimmedLine.includes('// Новости') &&
           !trimmedLine.includes('// Блог') &&
           !trimmedLine.includes('// Помощь') &&
           !trimmedLine.includes('// Поддержка') &&
           !trimmedLine.includes('// FAQ') &&
           !trimmedLine.includes('// ЧаВо') &&
           !trimmedLine.includes('// Контактная информация') &&
           !trimmedLine.includes('// О компании') &&
           !trimmedLine.includes('// О банке') &&
           !trimmedLine.includes('// История') &&
           !trimmedLine.includes('// Миссия') &&
           !trimmedLine.includes('// Цели') &&
           !trimmedLine.includes('// Значения') &&
           !trimmedLine.includes('// Принципы') &&
           !trimmedLine.includes('// Ценности') &&
           !trimmedLine.includes('// Руководство') &&
           !trimmedLine.includes('// Команда') &&
           !trimmedLine.includes('// Вакансии') &&
           !trimmedLine.includes('// Карьера') &&
           !trimmedLine.includes('// Работа') &&
           !trimmedLine.includes('// Отзывы сотрудников') &&
           !trimmedLine.includes('// Корпоративная культура') &&
           !trimmedLine.includes('// Социальная ответственность') &&
           !trimmedLine.includes('// Экология') &&
           !trimmedLine.includes('// Устойчивое развитие') &&
           !trimmedLine.includes('// ESG') &&
           !trimmedLine.includes('// Отчетность') &&
           !trimmedLine.includes('// Финансовая отчетность') &&
           !trimmedLine.includes('// Годовой отчет') &&
           !trimmedLine.includes('// Квартальный отчет') &&
           !trimmedLine.includes('// Инвесторам') &&
           !trimmedLine.includes('// Акционерам') &&
           !trimmedLine.includes('// Партнерам') &&
           !trimmedLine.includes('// Клиентам') &&
           !trimmedLine.includes('// Пользователям') &&
           !trimmedLine.includes('// Посетителям') &&
           !trimmedLine.includes('// Гостям') &&
           !trimmedLine.includes('// Интересы') &&
           !trimmedLine.includes('// Предпочтения') &&
           !trimmedLine.includes('// Настройки') &&
           !trimmedLine.includes('// Профиль') &&
           !trimmedLine.includes('// Аккаунт') &&
           !trimmedLine.includes('// Регистрация') &&
           !trimmedLine.includes('// Авторизация') &&
           !trimmedLine.includes('// Вход') &&
           !trimmedLine.includes('// Выход') &&
           !trimmedLine.includes('// Войти') &&
           !trimmedLine.includes('// Выйти') &&
           !trimmedLine.includes('// Зарегистрироваться') &&
           !trimmedLine.includes('// Забыли пароль') &&
           !trimmedLine.includes('// Восстановить пароль') &&
           !trimmedLine.includes('// Безопасность') &&
           !trimmedLine.includes('// Защита') &&
           !trimmedLine.includes('// Конфиденциальность') &&
           !trimmedLine.includes('// Политика конфиденциальности') &&
           !trimmedLine.includes('// Условия использования') &&
           !trimmedLine.includes('// Правила') &&
           !trimmedLine.includes('// Лицензия') &&
           !trimmedLine.includes('// Авторские права') &&
           !trimmedLine.includes('// Копирайт') &&
           !trimmedLine.includes('// Подписка') &&
           !trimmedLine.includes('// Уведомления') &&
           !trimmedLine.includes('// Оповещения') &&
           !trimmedLine.includes('// События') &&
           !trimmedLine.includes('// Календарь') &&
           !trimmedLine.includes('// Запись') &&
           !trimmedLine.includes('// Бронирование') &&
           !trimmedLine.includes('// Онлайн-запись') &&
           !trimmedLine.includes('// Запрос') &&
           !trimmedLine.includes('// Обращение') &&
           !trimmedLine.includes('// Жалоба') &&
           !trimmedLine.includes('// Предложение') &&
           !trimmedLine.includes('// Идея') &&
           !trimmedLine.includes('// Отзыв') &&
           !trimmedLine.includes('// Рекомендация') &&
           !trimmedLine.includes('// Сравнение') &&
           !trimmedLine.includes('// Калькулятор') &&
           !trimmedLine.includes('// Расчет') &&
           !trimmedLine.includes('// Симулятор') &&
           !trimmedLine.includes('// Модель') &&
           !trimmedLine.includes('// Прогноз') &&
           !trimmedLine.includes('// Анализ') &&
           !trimmedLine.includes('// Обзор') &&
           !trimmedLine.includes('// Статистика') &&
           !trimmedLine.includes('// Данные') &&
           !trimmedLine.includes('// Информация') &&
           !trimmedLine.includes('// Сведения') &&
           !trimmedLine.includes('// Детали') &&
           !trimmedLine.includes('// Подробности') &&
           !trimmedLine.includes('// Описание') &&
           !trimmedLine.includes('// Характеристики') &&
           !trimmedLine.includes('// Спецификации') &&
           !trimmedLine.includes('// Технические характеристики') &&
           !trimmedLine.includes('// Параметры') &&
           !trimmedLine.includes('// Настройки') &&
           !trimmedLine.includes('// Опции') &&
           !trimmedLine.includes('// Возможности') &&
           !trimmedLine.includes('// Функции') &&
           !trimmedLine.includes('// Особенности') &&
           !trimmedLine.includes('// Преимущества') &&
           !trimmedLine.includes('// Недостатки') &&
           !trimmedLine.includes('// Плюсы') &&
           !trimmedLine.includes('// Минусы') &&
           !trimmedLine.includes('// Риски') &&
           !trimmedLine.includes('// Преимущества') &&
           !trimmedLine.includes('// Преимущества и недостатки') &&
           !trimmedLine.includes('// Плюсы и минусы') &&
           !trimmedLine.includes('// Сравнительный анализ') &&
           !trimmedLine.includes('// Сравнение с конкурентами') &&
           !trimmedLine.includes('// Конкуренция') &&
           !trimmedLine.includes('// Рынок') &&
           !trimmedLine.includes('// Индустрия') &&
           !trimmedLine.includes('// Сектор') &&
           !trimmedLine.includes('// Отрасль') &&
           !trimmedLine.includes('// Тренды') &&
           !trimmedLine.includes('// Тенденции') &&
           !trimmedLine.includes('// Перспективы') &&
           !trimmedLine.includes('// Будущее') &&
           !trimmedLine.includes('// Развитие') &&
           !trimmedLine.includes('// Инновации') &&
           !trimmedLine.includes('// Технологии') &&
           !trimmedLine.includes('// Цифровизация') &&
           !trimmedLine.includes('// Цифровая трансформация') &&
           !trimmedLine.includes('// Fintech') &&
           !trimmedLine.includes('// Regtech') &&
           !trimmedLine.includes('// Insurtech') &&
           !trimmedLine.includes('// Legaltech') &&
           !trimmedLine.includes('// PropTech') &&
           !trimmedLine.includes('// WealthTech') &&
           !trimmedLine.includes('// PayTech') &&
           !trimmedLine.includes('// LendTech') &&
           !trimmedLine.includes('// BankTech') &&
           !trimmedLine.includes('// CreditTech') &&
           !trimmedLine.includes('// InvestTech') &&
           !trimmedLine.includes('// TradingTech') &&
           !trimmedLine.includes('// BlockTech') &&
           !trimmedLine.includes('// Crypto') &&
           !trimmedLine.includes('// Blockchain') &&
           !trimmedLine.includes('// Bitcoin') &&
           !trimmedLine.includes('// Ethereum') &&
           !trimmedLine.includes('// Smart contracts') &&
           !trimmedLine.includes('// DeFi') &&
           !trimmedLine.includes('// CeFi') &&
           !trimmedLine.includes('// NFT') &&
           !trimmedLine.includes('// Metaverse') &&
           !trimmedLine.includes('// Web3') &&
           !trimmedLine.includes('// DAO') &&
           !trimmedLine.includes('// DEX') &&
           !trimmedLine.includes('// CEX') &&
           !trimmedLine.includes('// Wallet') &&
           !trimmedLine.includes('// Exchange') &&
           !trimmedLine.includes('// Mining') &&
           !trimmedLine.includes('// Staking') &&
           !trimmedLine.includes('// Yield farming') &&
           !trimmedLine.includes('// Liquidity mining') &&
           !trimmedLine.includes('// AMM') &&
           !trimmedLine.includes('// LP') &&
           !trimmedLine.includes('// APY') &&
           !trimmedLine.includes('// APR') &&
           !trimmedLine.includes('// ROI') &&
           !trimmedLine.includes('// TVL') &&
           !trimmedLine.includes('// Market cap') &&
           !trimmedLine.includes('// Volume') &&
           !trimmedLine.includes('// Price') &&
           !trimmedLine.includes('// Supply') &&
           !trimmedLine.includes('// Circulating supply') &&
           !trimmedLine.includes('// Max supply') &&
           !trimmedLine.includes('// Fully diluted valuation') &&
           !trimmedLine.includes('// FDV') &&
           !trimmedLine.includes('// Market dominance') &&
           !trimmedLine.includes('// Market sentiment') &&
           !trimmedLine.includes('// Fear and greed index') &&
           !trimmedLine.includes('// Sentiment analysis') &&
           !trimmedLine.includes('// Technical analysis') &&
           !trimmedLine.includes('// Fundamental analysis') &&
           !trimmedLine.includes('// Chart') &&
           !trimmedLine.includes('// Candlestick') &&
           !trimmedLine.includes('// OHLC') &&
           !trimmedLine.includes('// Open') &&
           !trimmedLine.includes('// High') &&
           !trimmedLine.includes('// Low') &&
           !trimmedLine.includes('// Close') &&
           !trimmedLine.includes('// Volume') &&
           !trimmedLine.includes('// Moving average') &&
           !trimmedLine.includes('// MA') &&
           !trimmedLine.includes('// EMA') &&
           !trimmedLine.includes('// SMA') &&
           !trimmedLine.includes('// RSI') &&
           !trimmedLine.includes('// MACD') &&
           !trimmedLine.includes('// Bollinger Bands') &&
           !trimmedLine.includes('// BB') &&
           !trimmedLine.includes('// Fibonacci') &&
           !trimmedLine.includes('// Support') &&
           !trimmedLine.includes('// Resistance') &&
           !trimmedLine.includes('// Trend line') &&
           !trimmedLine.includes('// Channel') &&
           !trimmedLine.includes('// Pattern') &&
           !trimmedLine.includes('// Head and shoulders') &&
           !trimmedLine.includes('// Double top') &&
           !trimmedLine.includes('// Double bottom') &&
           !trimmedLine.includes('// Triangle') &&
           !trimmedLine.includes('// Flag') &&
           !trimmedLine.includes('// Pennant') &&
           !trimmedLine.includes('// Wedge') &&
           !trimmedLine.includes('// Cup and handle') &&
           !trimmedLine.includes('// Inverse head and shoulders') &&
           !trimmedLine.includes('// Triple top') &&
           !trimmedLine.includes('// Triple bottom') &&
           !trimmedLine.includes('// Rectangle') &&
           !trimmedLine.includes('// Ascending triangle') &&
           !trimmedLine.includes('// Descending triangle') &&
           !trimmedLine.includes('// Symmetrical triangle') &&
           !trimmedLine.includes('// Bullish flag') &&
           !trimmedLine.includes('// Bearish flag') &&
           !trimmedLine.includes('// Bullish pennant') &&
           !trimmedLine.includes('// Bearish pennant') &&
           !trimmedLine.includes('// Rising wedge') &&
           !trimmedLine.includes('// Falling wedge') &&
           !trimmedLine.includes('// Continuation pattern') &&
           !trimmedLine.includes('// Reversal pattern') &&
           !trimmedLine.includes('// Bullish pattern') &&
           !trimmedLine.includes('// Bearish pattern') &&
           !trimmedLine.includes('// Neutral pattern') &&
           !trimmedLine.includes('// Indecision pattern') &&
           !trimmedLine.includes('// Volatility') &&
           !trimmedLine.includes('// Beta') &&
           !trimmedLine.includes('// Alpha') &&
           !trimmedLine.includes('// Sharpe ratio') &&
           !trimmedLine.includes('// Sortino ratio') &&
           !trimmedLine.includes('// Treynor ratio') &&
           !trimmedLine.includes('// Information ratio') &&
           !trimmedLine.includes('// Tracking error') &&
           !trimmedLine.includes('// Correlation') &&
           !trimmedLine.includes('// Covariance') &&
           !trimmedLine.includes('// Standard deviation') &&
           !trimmedLine.includes('// Variance') &&
           !trimmedLine.includes('// Mean') &&
           !trimmedLine.includes('// Median') &&
           !trimmedLine.includes('// Mode') &&
           !trimmedLine.includes('// Range') &&
           !trimmedLine.includes('// Quartile') &&
           !trimmedLine.includes('// Percentile') &&
           !trimmedLine.includes('// Interquartile range') &&
           !trimmedLine.includes('// Skewness') &&
           !trimmedLine.includes('// Kurtosis') &&
           !trimmedLine.includes('// Normal distribution') &&
           !trimmedLine.includes('// Probability') &&
           !trimmedLine.includes('// Expected value') &&
           !trimmedLine.includes('// Variance') &&
           !trimmedLine.includes('// Standard deviation') &&
           !trimmedLine.includes('// Confidence interval') &&
           !trimmedLine.includes('// Hypothesis testing') &&
           !trimmedLine.includes('// Regression analysis') &&
           !trimmedLine.includes('// Correlation analysis') &&
           !trimmedLine.includes('// ANOVA') &&
           !trimmedLine.includes('// Chi-square test') &&
           !trimmedLine.includes('// T-test') &&
           !trimmedLine.includes('// Z-test') &&
           !trimmedLine.includes('// F-test') &&
           !trimmedLine.includes('// Kolmogorov-Smirnov test') &&
           !trimmedLine.includes('// Shapiro-Wilk test') &&
           !trimmedLine.includes('// Anderson-Darling test') &&
           !trimmedLine.includes('// Jarque-Bera test') &&
           !trimmedLine.includes('// Augmented Dickey-Fuller test') &&
           !trimmedLine.includes('// Phillips-Perron test') &&
           !trimmedLine.includes('// KPSS test') &&
           !trimmedLine.includes('// Johansen test') &&
           !trimmedLine.includes('// Granger causality test') &&
           !trimmedLine.includes('// Cointegration') &&
           !trimmedLine.includes('// Stationarity') &&
           !trimmedLine.includes('// Unit root') &&
           !trimmedLine.includes('// Random walk') &&
           !trimmedLine.includes('// ARIMA') &&
           !trimmedLine.includes('// GARCH') &&
           !trimmedLine.includes('// ARCH') &&
           !trimmedLine.includes('// EGARCH') &&
           !trimmedLine.includes('// TGARCH') &&
           !trimmedLine.includes('// APARCH') &&
           !trimmedLine.includes('// CGARCH') &&
           !trimmedLine.includes('// IGARCH') &&
           !trimmedLine.includes('// FIGARCH') &&
           !trimmedLine.includes('// HYGARCH') &&
           !trimmedLine.includes('// NGARCH') &&
           !trimmedLine.includes('// AVGARCH') &&
           !trimmedLine.includes('// AGARCH') &&
           !trimmedLine.includes('// GJR-GARCH') &&
           !trimmedLine.includes('// EGARCH-M') &&
           !trimmedLine.includes('// GARCH-in-mean') &&
           !trimmedLine.includes('// MGARCH') &&
           !trimmedLine.includes('// DCC-GARCH') &&
           !trimmedLine.includes('// CCC-GARCH') &&
           !trimmedLine.includes('// BEKK-GARCH') &&
           !trimmedLine.includes('// GO-GARCH') &&
           !trimmedLine.includes('// Factor-GARCH') &&
           !trimmedLine.includes('// Multivariate GARCH') &&
           !trimmedLine.includes('// VAR') &&
           !trimmedLine.includes('// VECM') &&
           !trimmedLine.includes('// SVAR') &&
           !trimmedLine.includes('// SVECM') &&
           !trimmedLine.includes('// Panel data') &&
           !trimmedLine.includes('// Cross-sectional data') &&
           !trimmedLine.includes('// Time series data') &&
           !trimmedLine.includes('// Pooled data') &&
           !trimmedLine.includes('// Panel-corrected standard errors') &&
           !trimmedLine.includes('// Fixed effects') &&
           !trimmedLine.includes('// Random effects') &&
           !trimmedLine.includes('// Between estimator') &&
           !trimmedLine.includes('// Within estimator') &&
           !trimmedLine.includes('// First-difference estimator') &&
           !trimmedLine.includes('// Generalized method of moments') &&
           !trimmedLine.includes('// GMM') &&
           !trimmedLine.includes('// Instrumental variables') &&
           !trimmedLine.includes('// IV') &&
           !trimmedLine.includes('// Two-stage least squares') &&
           !trimmedLine.includes('// 2SLS') &&
           !trimmedLine.includes('// Three-stage least squares') &&
           !trimmedLine.includes('// 3SLS') &&
           !trimmedLine.includes('// Limited information maximum likelihood') &&
           !trimmedLine.includes('// LIML') &&
           !trimmedLine.includes('// Full information maximum likelihood') &&
           !trimmedLine.includes('// FIML') &&
           !trimmedLine.includes('// Structural equation modeling') &&
           !trimmedLine.includes('// SEM') &&
           !trimmedLine.includes('// Path analysis') &&
           !trimmedLine.includes('// Confirmatory factor analysis') &&
           !trimmedLine.includes('// CFA') &&
           !trimmedLine.includes('// Exploratory factor analysis') &&
           !trimmedLine.includes('// EFA') &&
           !trimmedLine.includes('// Principal component analysis') &&
           !trimmedLine.includes('// PCA') &&
           !trimmedLine.includes('// Independent component analysis') &&
           !trimmedLine.includes('// ICA') &&
           !trimmedLine.includes('// Cluster analysis') &&
           !trimmedLine.includes('// K-means clustering') &&
           !trimmedLine.includes('// Hierarchical clustering') &&
           !trimmedLine.includes('// DBSCAN') &&
           !trimmedLine.includes('// Gaussian mixture model') &&
           !trimmedLine.includes('// GMM clustering') &&
           !trimmedLine.includes('// Latent class analysis') &&
           !trimmedLine.includes('// LCA') &&
           !trimmedLine.includes('// Latent profile analysis') &&
           !trimmedLine.includes('// LPA') &&
           !trimmedLine.includes('// Finite mixture model') &&
           !trimmedLine.includes('// FMM') &&
           !trimmedLine.includes('// Hidden Markov model') &&
           !trimmedLine.includes('// HMM') &&
           !trimmedLine.includes('// Kalman filter') &&
           !trimmedLine.includes('// Particle filter') &&
           !trimmedLine.includes('// Sequential Monte Carlo') &&
           !trimmedLine.includes('// SMC') &&
           !trimmedLine.includes('// Markov Chain Monte Carlo') &&
           !trimmedLine.includes('// MCMC') &&
           !trimmedLine.includes('// Gibbs sampling') &&
           !trimmedLine.includes('// Metropolis-Hastings algorithm') &&
           !trimmedLine.includes('// Hamiltonian Monte Carlo') &&
           !trimmedLine.includes('// HMC') &&
           !trimmedLine.includes('// No-U-Turn sampler') &&
           !trimmedLine.includes('// NUTS') &&
           !trimmedLine.includes('// Variational inference') &&
           !trimmedLine.includes('// VI') &&
           !trimmedLine.includes('// Automatic differentiation variational inference') &&
           !trimmedLine.includes('// ADVI') &&
           !trimmedLine.includes('// Expectation propagation') &&
           !trimmedLine.includes('// EP') &&
           !trimmedLine.includes('// Laplace approximation') &&
           !trimmedLine.includes('// Variational Bayes') &&
           !trimmedLine.includes('// VB') &&
           !trimmedLine.includes('// Mean-field approximation') &&
           !trimmedLine.includes('// Structured mean-field') &&
           !trimmedLine.includes('// Bethe approximation') &&
           !trimmedLine.includes('// Loopy belief propagation') &&
           !trimmedLine.includes('// LBP') &&
           !trimmedLine.includes('// Generalized belief propagation') &&
           !trimmedLine.includes('// GBP') &&
           !trimmedLine.includes('// Expectation maximization') &&
           !trimmedLine.includes('// EM') &&
           !trimmedLine.includes('// Variational EM') &&
           !trimmedLine.includes('// Stochastic EM') &&
           !trimmedLine.includes('// SEM') &&
           !trimmedLine.includes('// Monte Carlo EM') &&
           !trimmedLine.includes('// MCEM') &&
           !trimmedLine.includes('// Classification EM') &&
           !trimmedLine.includes('// CEM') &&
           !trimmedLine.includes('// Bayesian inference') &&
           !trimmedLine.includes('// Bayes theorem') &&
           !trimmedLine.includes('// Prior distribution') &&
           !trimmedLine.includes('// Posterior distribution') &&
           !trimmedLine.includes('// Likelihood function') &&
           !trimmedLine.includes('// Conjugate prior') &&
           !trimmedLine.includes('// Non-informative prior') &&
           !trimmedLine.includes('// Improper prior') &&
           !trimmedLine.includes('// Jeffreys prior') &&
           !trimmedLine.includes('// Reference prior') &&
           !trimmedLine.includes('// Objective prior') &&
           !trimmedLine.includes('// Subjective prior') &&
           !trimmedLine.includes('// Informative prior') &&
           !trimmedLine.includes('// Hyperparameter') &&
           !trimmedLine.includes('// Hyperprior') &&
           !trimmedLine.includes('// Hierarchical Bayes') &&
           !trimmedLine.includes('// Empirical Bayes') &&
           !trimmedLine.includes('// Bayes factor') &&
           !trimmedLine.includes('// Model evidence') &&
           !trimmedLine.includes('// Marginal likelihood') &&
           !trimmedLine.includes('// Occam\'s razor') &&
           !trimmedLine.includes('// Bayesian model selection') &&
           !trimmedLine.includes('// Bayesian model averaging') &&
           !trimmedLine.includes('// BMA') &&
           !trimmedLine.includes('// Bayesian variable selection') &&
           !trimmedLine.includes('// Bayesian regularization') &&
           !trimmedLine.includes('// Bayesian shrinkage') &&
           !trimmedLine.includes('// Bayesian lasso') &&
           !trimmedLine.includes('// Bayesian ridge') &&
           !trimmedLine.includes('// Bayesian elastic net') &&
           !trimmedLine.includes('// Bayesian neural network') &&
           !trimmedLine.includes('// BNN') &&
           !trimmedLine.includes('// Bayesian deep learning') &&
           !trimmedLine.includes('// Bayesian optimization') &&
           !trimmedLine.includes('// BO') &&
           !trimmedLine.includes('// Gaussian process') &&
           !trimmedLine.includes('// GP') &&
           !trimmedLine.includes('// Support vector machine') &&
           !trimmedLine.includes('// SVM') &&
           !trimmedLine.includes('// Kernel method') &&
           !trimmedLine.includes('// Reproducing kernel Hilbert space') &&
           !trimmedLine.includes('// RKHS') &&
           !trimmedLine.includes('// Mercer\'s theorem') &&
           !trimmedLine.includes('// Positive definite kernel') &&
           !trimmedLine.includes('// Stationary kernel') &&
           !trimmedLine.includes('// Isotropic kernel') &&
           !trimmedLine.includes('// Anisotropic kernel') &&
           !trimmedLine.includes('// Radial basis function') &&
           !trimmedLine.includes('// RBF') &&
           !trimmedLine.includes('// Polynomial kernel') &&
           !trimmedLine.includes('// Linear kernel') &&
           !trimmedLine.includes('// Sigmoid kernel') &&
           !trimmedLine.includes('// Laplacian kernel') &&
           !trimmedLine.includes('// Matérn kernel') &&
           !trimmedLine.includes('// Periodic kernel') &&
           !trimmedLine.includes('// Locally periodic kernel') &&
           !trimmedLine.includes('// Spectral mixture kernel') &&
           !trimmedLine.includes('// SM kernel') &&
           !trimmedLine.includes('// Spectral density') &&
           !trimmedLine.includes('// Bochner\'s theorem') &&
           !trimmedLine.includes('// Wiener-Khintchine theorem') &&
           !trimmedLine.includes('// Fourier transform') &&
           !trimmedLine.includes('// Laplace transform') &&
           !trimmedLine.includes('// Z-transform') &&
           !trimmedLine.includes('// Wavelet transform') &&
           !trimmedLine.includes('// Continuous wavelet transform') &&
           !trimmedLine.includes('// CWT') &&
           !trimmedLine.includes('// Discrete wavelet transform') &&
           !trimmedLine.includes('// DWT') &&
           !trimmedLine.includes('// Fast wavelet transform') &&
           !trimmedLine.includes('// FWT') &&
           !trimmedLine.includes('// Haar wavelet') &&
           !trimmedLine.includes('// Daubechies wavelet') &&
           !trimmedLine.includes('// Coiflet') &&
           !trimmedLine.includes('// Symlet') &&
           !trimmedLine.includes('// Biorthogonal wavelet') &&
           !trimmedLine.includes('// Reverse biorthogonal wavelet') &&
           !trimmedLine.includes('// Meyer wavelet') &&
           !trimmedLine.includes('// Mexican hat wavelet') &&
           !trimmedLine.includes('// Morlet wavelet') &&
           !trimmedLine.includes('// Gabor wavelet') &&
           !trimmedLine.includes('// Shannon wavelet') &&
           !trimmedLine.includes('// Battle-Lemarié wavelet') &&
           !trimmedLine.includes('// spline wavelet') &&
           !trimmedLine.includes('// orthogonal spline wavelet') &&
           !trimmedLine.includes('// cardinal B-spline wavelet') &&
           !trimmedLine.includes('// semi-orthogonal spline wavelet') &&
           !trimmedLine.includes('// polynomial spline wavelet') &&
           !trimmedLine.includes('// exponential spline wavelet') &&
           !trimmedLine.includes('// rational spline wavelet') &&
           !trimmedLine.includes('// trigonometric spline wavelet') &&
           !trimmedLine.includes('// hyperbolic spline wavelet') &&
           !trimmedLine.includes('// logarithmic spline wavelet') &&
           !trimmedLine.includes('// power spline wavelet') &&
           !trimmedLine.includes('// fractional spline wavelet') &&
           !trimmedLine.includes('// complex spline wavelet') &&
           !trimmedLine.includes('// quaternion spline wavelet') &&
           !trimmedLine.includes('// Clifford spline wavelet') &&
           !trimmedLine.includes('// geometric algebra spline wavelet') &&
           !trimmedLine.includes('// tensor spline wavelet') &&
           !trimmedLine.includes('// multiresolution analysis') &&
           !trimmedLine.includes('// MRA') &&
           !trimmedLine.includes('// scaling function') &&
           !trimmedLine.includes('// wavelet function') &&
           !trimmedLine.includes('// dilation equation') &&
           !trimmedLine.includes('// refinement equation') &&
           !trimmedLine.includes('// cascade algorithm') &&
           !trimmedLine.includes('// subdivision scheme') &&
           !trimmedLine.includes('// interpolatory subdivision') &&
           !trimmedLine.includes('// approximating subdivision') &&
           !trimmedLine.includes('// stationary subdivision') &&
           !trimmedLine.includes('// non-stationary subdivision') &&
           !trimmedLine.includes('// linear subdivision') &&
           !trimmedLine.includes('// nonlinear subdivision') &&
           !trimmedLine.includes('// adaptive subdivision') &&
           !trimmedLine.includes('// multigrid method') &&
           !trimmedLine.includes('// finite element method') &&
           !trimmedLine.includes('// FEM') &&
           !trimmedLine.includes('// finite difference method') &&
           !trimmedLine.includes('// FDM') &&
           !trimmedLine.includes('// finite volume method') &&
           !trimmedLine.includes('// FVM') &&
           !trimmedLine.includes('// boundary element method') &&
           !trimmedLine.includes('// BEM') &&
           !trimmedLine.includes('// spectral method') &&
           !trimmedLine.includes('// pseudospectral method') &&
           !trimmedLine.includes('// collocation method') &&
           !trimmedLine.includes('// Galerkin method') &&
           !trimmedLine.includes('// Petrov-Galerkin method') &&
           !trimmedLine.includes('// least squares method') &&
           !trimmedLine.includes('// weighted residual method') &&
           !trimmedLine.includes('// Rayleigh-Ritz method') &&
           !trimmedLine.includes('// Kantorovich method') &&
           !trimmedLine.includes('// Bubnov-Galerkin method') &&
           !trimmedLine.includes('// discontinuous Galerkin method') &&
           !trimmedLine.includes('// DG') &&
           !trimmedLine.includes('// continuous Galerkin method') &&
           !trimmedLine.includes('// CG') &&
           !trimmedLine.includes('// mixed finite element method') &&
           !trimmedLine.includes('// hybrid finite element method') &&
           !trimmedLine.includes('// hybridizable discontinuous Galerkin method') &&
           !trimmedLine.includes('// HDG') &&
           !trimmedLine.includes('// embedded discontinuous Galerkin method') &&
           !trimmedLine.includes('// EDG') &&
           !trimmedLine.includes('// weak Galerkin finite element method') &&
           !trimmedLine.includes('// WG') &&
           !trimmedLine.includes('// virtual element method') &&
           !trimmedLine.includes('// VEM') &&
           !trimmedLine.includes('// mimetic finite difference method') &&
           !trimmedLine.includes('// MFD') &&
           !trimmedLine.includes('// discrete exterior calculus') &&
           !trimmedLine.includes('// DEC') &&
           !trimmedLine.includes('// finite volume element method') &&
           !trimmedLine.includes('// FVEM') &&
           !trimmedLine.includes('// control volume finite element method') &&
           !trimmedLine.includes('// CVFEM') &&
           !trimmedLine.includes('// control volume method') &&
           !trimmedLine.includes('// CVM') &&
           !trimmedLine.includes('// flux corrected transport') &&
           !trimmedLine.includes('// FCT') &&
           !trimmedLine.includes('// total variation diminishing') &&
           !trimmedLine.includes('// TVD') &&
           !trimmedLine.includes('// essentially non-oscillatory') &&
           !trimmedLine.includes('// ENO') &&
           !trimmedLine.includes('// weighted essentially non-oscillatory') &&
           !trimmedLine.includes('// WENO') &&
           !trimmedLine.includes('// monotonicity preserving') &&
           !trimmedLine.includes('// maximum principle') &&
           !trimmedLine.includes('// comparison principle') &&
           !trimmedLine.includes('// barrier function') &&
           !trimmedLine.includes('// penalty method') &&
           !trimmedLine.includes('// augmented Lagrangian method') &&
           !trimmedLine.includes('// method of Lagrange multipliers') &&
           !trimmedLine.includes('// Karush-Kuhn-Tucker conditions') &&
           !trimmedLine.includes('// KKT conditions') &&
           !trimmedLine.includes('// Fritz John conditions') &&
           !trimmedLine.includes('// constraint qualification') &&
           !trimmedLine.includes('// Slater condition') &&
           !trimmedLine.includes('// Mangasarian-Fromovitz constraint qualification') &&
           !trimmedLine.includes('// MFCQ') &&
           !trimmedLine.includes('// linear independence constraint qualification') &&
           !trimmedLine.includes('// LICQ') &&
           !trimmedLine.includes('// regular point') &&
           !trimmedLine.includes('// stationary point') &&
           !trimmedLine.includes('// critical point') &&
           !trimmedLine.includes('// saddle point') &&
           !trimmedLine.includes('// inflection point') &&
           !trimmedLine.includes('// turning point') &&
           !trimmedLine.includes('// inflection point') &&
           !trimmedLine.includes('// stationary inflection point') &&
           !trimmedLine.includes('// non-degenerate critical point') &&
           !trimmedLine.includes('// Morse lemma') &&
           !trimmedLine.includes('// Morse theory') &&
           !trimmedLine.includes('// critical point theory') &&
           !trimmedLine.includes('// Lyapunov stability') &&
           !trimmedLine.includes('// asymptotic stability') &&
           !trimmedLine.includes('// exponential stability') &&
           !trimmedLine.includes('// uniform stability') &&
           !trimmedLine.includes('// global stability') &&
           !trimmedLine.includes('// local stability') &&
           !trimmedLine.includes('// orbital stability') &&
           !trimmedLine.includes('// structural stability') &&
           !trimmedLine.includes('// robust stability') &&
           !trimmedLine.includes('// input-to-state stability') &&
           !trimmedLine.includes('// ISS') &&
           !trimmedLine.includes('// integral input-to-state stability') &&
           !trimmedLine.includes('// iISS') &&
           !trimmedLine.includes('// input-output stability') &&
           !trimmedLine.includes('// L-stability') &&
           !trimmedLine.includes('// A-stability') &&
           !trimmedLine.includes('// L-stability') &&
           !trimmedLine.includes('// A(alpha)-stability') &&
           !trimmedLine.includes('// stiff decay') &&
           !trimmedLine.includes('// damping') &&
           !trimmedLine.includes('// dissipation') &&
           !trimmedLine.includes('// dispersion') &&
           !trimmedLine.includes('// phase lag') &&
           !trimmedLine.includes('// amplitude error') &&
           !trimmedLine.includes('// period error') &&
           !trimmedLine.includes('// energy conservation') &&
           !trimmedLine.includes('// symplectic integrator') &&
           !trimmedLine.includes('// geometric integration') &&
           !trimmedLine.includes('// variational integrator') &&
           !trimmedLine.includes('// multisymplectic integrator') &&
           !trimmedLine.includes('// momentum map') &&
           !trimmedLine.includes('// Poisson bracket') &&
           !trimmedLine.includes('// Lie derivative') &&
           !trimmedLine.includes('// exterior derivative') &&
           !trimmedLine.includes('// interior product') &&
           !trimmedLine.includes('// Cartan\'s magic formula') &&
           !trimmedLine.includes('// de Rham cohomology') &&
           !trimmedLine.includes('// Hodge theory') &&
           !trimmedLine.includes('// Hodge star operator') &&
           !trimmedLine.includes('// Laplace-de Rham operator') &&
           !trimmedLine.includes('// Hodge decomposition') &&
           !trimmedLine.includes('// harmonic form') &&
           !trimmedLine.includes('// coexact form') &&
           !trimmedLine.includes('// coclosed form') &&
           !trimmedLine.includes('// exact form') &&
           !trimmedLine.includes('// closed form') &&
           !trimmedLine.includes('// conservative vector field') &&
           !trimmedLine.includes('// irrotational vector field') &&
           !trimmedLine.includes('// solenoidal vector field') &&
           !trimmedLine.includes('// lamellar vector field') &&
           !trimmedLine.includes('// central vector field') &&
           !trimmedLine.includes('// axial vector field') &&
           !trimmedLine.includes('// polar vector field') &&
           !trimmedLine.includes('// pseudovector field') &&
           !trimmedLine.includes('// pseudoscalar field') &&
           !trimmedLine.includes('// scalar field') &&
           !trimmedLine.includes('// vector field') &&
           !trimmedLine.includes('// tensor field') &&
           !trimmedLine.includes('// spinor field') &&
           !trimmedLine.includes('// twistor field') &&
           !trimmedLine.includes('// gauge field') &&
           !trimmedLine.includes('// connection form') &&
           !trimmedLine.includes('// curvature form') &&
           !trimmedLine.includes('// Bianchi identity') &&
           !trimmedLine.includes('// Cartan structure equations') &&
           !trimmedLine.includes('// Maurer-Cartan form') &&
           !trimmedLine.includes('// Killing vector field') &&
           !trimmedLine.includes('// conformal vector field') &&
           !trimmedLine.includes('// homothetic vector field') &&
           !trimmedLine.includes('// affine vector field') &&
           !trimmedLine.includes('// projective vector field') &&
           !trimmedLine.includes('// conformal Killing equation') &&
           !trimmedLine.includes('// Killing equation') &&
           !trimmedLine.includes('// geodesic equation') &&
           !trimmedLine.includes('// auto-parallel equation') &&
           !trimmedLine.includes('// autoparallel curve') &&
           !trimmedLine.includes('// geodesic curve') &&
           !trimmedLine.includes('// Jacobi field') &&
           !trimmedLine.includes('// Jacobi equation') &&
           !trimmedLine.includes('// conjugate point') &&
           !trimmedLine.includes('// cut point') &&
           !trimmedLine.includes('// injectivity radius') &&
           !trimmedLine.includes('// convexity radius') &&
           !trimmedLine.includes('// focal point') &&
           !trimmedLine.includes('// focal set') &&
           !trimmedLine.includes('// cut locus') &&
           !trimmedLine.includes('// conjugate locus') &&
           !trimmedLine.includes('// injectivity domain') &&
           !trimmedLine.includes('// normal neighborhood') &&
           !trimmedLine.includes('// totally normal neighborhood') &&
           !trimmedLine.includes('// convex neighborhood') &&
           !trimmedLine.includes('// geodesically convex set') &&
           !trimmedLine.includes('// strongly convex set') &&
           !trimmedLine.includes('// totally convex set') &&
           !trimmedLine.includes('// convex hull') &&
           !trimmedLine.includes('// closed convex hull') &&
           !trimmedLine.includes('// weakly closed convex hull') &&
           !trimmedLine.includes('// strongly closed convex hull') &&
           !trimmedLine.includes('// compact convex set') &&
           !trimmedLine.includes('// locally compact convex set') &&
           !trimmedLine.includes('// complete convex set') &&
           !trimmedLine.includes('// bounded convex set') &&
           !trimmedLine.includes('// unbounded convex set') &&
           !trimmedLine.includes('// finite-dimensional convex set') &&
           !trimmedLine.includes('// infinite-dimensional convex set') &&
           !trimmedLine.includes('// polyhedral convex set') &&
           !trimmedLine.includes('// simplicial convex set') &&
           !trimmedLine.includes('// smooth convex set') &&
           !trimmedLine.includes('// nonsmooth convex set') &&
           !trimmedLine.includes('// strictly convex set') &&
           !trimmedLine.includes('// uniformly convex set') &&
           !trimmedLine.includes('// locally uniformly convex set') &&
           !trimmedLine.includes('// midpoint convex set') &&
           !trimmedLine.includes('// Jensen convex set') &&
           !trimmedLine.includes('// Wright convex set') &&
           !trimmedLine.includes('// Schur convex set') &&
           !trimmedLine.includes('// multiplicatively convex set') &&
           !trimmedLine.includes('// logarithmically convex set') &&
           !trimmedLine.includes('// quasi-convex set') &&
           !trimmedLine.includes('// pseudo-convex set') &&
           !trimmedLine.includes('// invex set') &&
           !trimmedLine.includes('// eta-invex set') &&
           !trimmedLine.includes('// rho-invex set') &&
           !trimmedLine.includes('// F-invex set') &&
           !trimmedLine.includes('// generalized convex set') &&
           !trimmedLine.includes('// phi-convex set') &&
           !trimmedLine.includes('// (alpha, m)-convex set') &&
           !trimmedLine.includes('// s-convex set') &&
           !trimmedLine.includes('// h-convex set') &&
           !trimmedLine.includes('// Godunova-Levin set') &&
           !trimmedLine.includes('// P-function set') &&
           !trimmedLine.includes('// Q-function set') &&
           !trimmedLine.includes('// r-convex set') &&
           !trimmedLine.includes('// relative convex set') &&
           !trimmedLine.includes('// abstract convex set') &&
           !trimmedLine.includes('// fuzzy convex set') &&
           !trimmedLine.includes('// intuitionistic fuzzy convex set') &&
           !trimmedLine.includes('// rough convex set') &&
           !trimmedLine.includes('// soft convex set') &&
           !trimmedLine.includes('// bipolar fuzzy convex set') &&
           !trimmedLine.includes('// picture fuzzy convex set') &&
           !trimmedLine.includes('// spherical fuzzy convex set') &&
           !trimmedLine.includes('// neutrosophic convex set') &&
           !trimmedLine.includes('// plithogenic convex set') &&
           !trimmedLine.includes('// interval-valued convex set') &&
           !trimmedLine.includes('// type-2 fuzzy convex set') &&
           !trimmedLine.includes('// interval-valued intuitionistic fuzzy convex set') &&
           !trimmedLine.includes('// Pythagorean fuzzy convex set') &&
           !trimmedLine.includes('// q-rung orthopair fuzzy convex set') &&
           !trimmedLine.includes('// Fermatean fuzzy convex set') &&
           !trimmedLine.includes('// picture 2-tuple linguistic convex set') &&
           !trimmedLine.includes('// hesitant fuzzy convex set') &&
           !trimmedLine.includes('// dual hesitant fuzzy convex set') &&
           !trimmedLine.includes('// complex fuzzy convex set') &&
           !trimmedLine.includes('// complex intuitionistic fuzzy convex set') &&
           !trimmedLine.includes('// complex neutrosophic convex set') &&
           !trimmedLine.includes('// complex picture fuzzy convex set') &&
           !trimmedLine.includes('// complex Pythagorean fuzzy convex set') &&
           !trimmedLine.includes('// complex q-rung orthopair fuzzy convex set') &&
           !trimmedLine.includes('// complex Fermatean fuzzy convex set') &&
           !trimmedLine.includes('// complex picture 2-tuple linguistic convex set') &&
           !trimmedLine.includes('// complex hesitant fuzzy convex set') &&
           !trimmedLine.includes('// complex dual hesitant fuzzy convex set') &&
           !trimmedLine.includes('// complex bipolar fuzzy convex set') &&
           !trimmedLine.includes('// complex spherical fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued intuitionistic fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued Pythagorean fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued q-rung orthopair fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued Fermatean fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued picture fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued spherical fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued hesitant fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued dual hesitant fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued bipolar fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued picture 2-tuple linguistic convex set') &&
           !trimmedLine.includes('// complex interval-valued complex fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued complex intuitionistic fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued complex neutrosophic convex set') &&
           !trimmedLine.includes('// complex interval-valued complex picture fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued complex Pythagorean fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued complex q-rung orthopair fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued complex Fermatean fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued complex picture 2-tuple linguistic convex set') &&
           !trimmedLine.includes('// complex interval-valued complex hesitant fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued complex dual hesitant fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued complex bipolar fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued complex spherical fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued complex interval-valued fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued complex interval-valued intuitionistic fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued complex interval-valued Pythagorean fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued complex interval-valued q-rung orthopair fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued complex interval-valued Fermatean fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued complex interval-valued picture fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued complex interval-valued spherical fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued complex interval-valued hesitant fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued complex interval-valued dual hesitant fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued complex interval-valued bipolar fuzzy convex set') &&
           !trimmedLine.includes('// complex interval-valued complex interval-valued picture 2-tuple linguistic convex set') &&
           trimmedLine !== '' && 
           trimmedLine !== ',' && 
           trimmedLine !== '{' && 
           trimmedLine !== '}' &&
           !trimmedLine.startsWith('/*') &&
           !trimmedLine.endsWith('*/');
  });
  
  return filteredLines.join('\n');
}

/**
 * Функция для проверки валидности JSON
 */
function isValidJson(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Рекурсивный поиск всех JSON-файлов в директории
 */
async function findAllJsonFiles(dir) {
  const results = [];
  const items = await fs.readdir(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      // Рекурсивно обрабатываем поддиректории
      const subDirResults = await findAllJsonFiles(fullPath);
      results.push(...subDirResults);
    } else if (item.isFile() && path.extname(item.name) === '.json') {
      results.push(fullPath);
    }
  }
  
  return results;
}

/**
 * Очистка всех JSON-файлов в директории
 */
async function cleanJsonFiles(directory) {
  // Находим все JSON-файлы в директории рекурсивно
  const jsonFiles = await findAllJsonFiles(directory);
  
  console.log(`Найдено ${jsonFiles.length} JSON-файлов для очистки`);
  
  let cleanedCount = 0;
  let invalidCount = 0;
  
  for (const file of jsonFiles) {
    try {
      const content = await fs.readFile(file, 'utf8');
      
      // Пробуем очистить содержимое
      const cleanedContent = cleanJsonContent(content);
      
      // Проверяем, стал ли файл валидным после очистки
      if (isValidJson(cleanedContent)) {
        await fs.writeFile(file, cleanedContent, 'utf8');
        console.log(`Очищен файл: ${file}`);
        cleanedCount++;
      } else {
        console.log(`Не удалось очистить файл (остался невалидным): ${file}`);
        invalidCount++;
      }
    } catch (error) {
      console.error(`Ошибка при обработке файла ${file}:`, error.message);
    }
  }
  
  console.log(`\nОчистка завершена:`);
  console.log(`- Очищено файлов: ${cleanedCount}`);
  console.log(`- Осталось невалидных: ${invalidCount}`);
}

// Запуск очистки
async function runCleanup() {
  const dataDir = path.join(__dirname, '../data/pdfs');
  console.log(`Запуск очистки JSON-файлов в директории: ${dataDir}\n`);
  
  await cleanJsonFiles(dataDir);
}

// Если файл запускается напрямую
if (require.main === module) {
  runCleanup().catch(console.error);
}

module.exports = {
  cleanJsonContent,
  isValidJson,
  cleanJsonFiles
};