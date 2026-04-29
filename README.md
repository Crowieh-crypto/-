# Регистър задачи

Българска система за следене на задачи, която замества Excel файл с по-удобен регистър.

Приложението позволява въвеждане на задача с **рег. №**, **дата**, **срок** и автоматично изчислява **до кога трябва да бъде изпълнена задачата**.

## Функции

- Рег. № на задачата
- Дата на регистрация
- Автоматично изчисляване на краен срок
- Поддържани срокове:
  - 14 работни дни
  - 20 работни дни
  - 30 календарни дни
- Статуси:
  - За изпълнение
  - В процес
  - За преглед
  - Готово
- Поле „Остава от задачата“
- Отговорник
- Приоритет
- Етикети
- Търсене и филтри
- Табло със статистики
- Локално запазване на данните в браузъра / приложението
- Desktop версия чрез Electron
- GitHub Actions workflow за автоматично създаване на Windows `.exe`

## Важно за сроковете

В тази версия „работни дни“ означава понеделник–петък.

Официалните празници все още не са включени в изчислението.

## Пускане като уеб приложение

Инсталирай Node.js 22 или по-нова версия.

След това изпълни:

```bash
npm install
npm run dev
```

Отвори адреса, който Vite показва в терминала. Обикновено е:

```txt
http://localhost:5173
```

## Пускане като desktop приложение по време на разработка

```bash
npm install
npm run electron:dev
```

## Създаване на Windows .exe локално

На Windows компютър изпълни:

```bash
npm install
npm run dist
```

Готовият installer ще бъде в папката:

```txt
release/
```

## Създаване на .exe през GitHub

В проекта има готов workflow:

```txt
.github/workflows/build-windows.yml
```

### Вариант 1: ръчно стартиране

1. Качи проекта в GitHub repository.
2. Отвори таб **Actions**.
3. Избери **Build Windows EXE**.
4. Натисни **Run workflow**.
5. След приключване изтегли файла от **Artifacts**.

### Вариант 2: чрез Git tag

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub автоматично ще създаде Windows `.exe` като artifact.

## Качване в GitHub

```bash
git init
git add .
git commit -m "Initial task registry app"
git branch -M main
git remote add origin https://github.com/USERNAME/registar-zadachi.git
git push -u origin main
```

Смени `USERNAME` с твоя GitHub username.

## Технологии

- React
- TypeScript
- Vite
- Electron
- Electron Builder
- GitHub Actions

## Следващи подобрения

- Експорт към Excel/CSV
- Импорт от Excel/CSV
- Празнични дни при изчисляване на работни дни
- SQLite база данни вместо localStorage
- Потребители и роли
- История на промените по задача
