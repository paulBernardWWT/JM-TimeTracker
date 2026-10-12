# Task Timer

A simple time tracker that runs entirely in your browser. Type a task name, start the timer, and see how your time adds up by day, week, and longer periods. There's nothing to install and no account to create, and your data never leaves your computer.

## Getting started

1. Open `index.html` in any modern browser (Chrome, Edge, Firefox, Safari), or open the hosted link if your team has one.
2. Type what you're working on in the box at the top and press **Start** (or Enter).
3. Press **Stop** when you're done. Starting another task stops the current one automatically, because only one timer runs at a time.

Your tasks and time are saved automatically and are still there the next time you open the app.

## The Timer tab

The Timer tab has two views, switched with the **Today** and **Totals** buttons.

### Today

Shows the tasks you've worked on today, with the time spent on each one today and a **Total today** at the bottom.

| Button | What it does |
| --- | --- |
| **Start / Stop** | Starts or stops the timer for that task. |
| **Edit** | Opens a dialog to change the task's name, color, and today's time (hours and minutes). Saving sets the seconds back to 0. |
| **✕** | Deletes today's time for that task, after asking you to confirm. Earlier days are not affected. |

Notes:

- Typing a name that already exists (capitalization doesn't matter) resumes that task instead of creating a duplicate.
- Two tasks can't share the same name. Renaming a task to an existing name is blocked.
- Each task has a color. It's chosen automatically, and you can change it in **Edit**. The color is used on the Week tab as well.
- Editing the time of a running task keeps the timer running from the new time.

### Totals

Shows the total time spent on each task across a longer period, so you can see where your time has gone over weeks or months.

- Pick the period with the **Period** dropdown: *This week*, *This month*, *Last 30 days* (the default), *This year*, or *All time*. The app remembers your choice.
- Tasks are listed with the most recently tracked task first.
- A **Total** for the selected period is shown at the bottom.
- Press **Continue** on any task to start a fresh timer for it. The task moves to the Today view, and its history stays in Totals.
- Tasks in Totals can't be edited or deleted. To change a task's name, color, or today's time, use the Today view.

## The Week tab

A calendar of your week, with each day showing the tasks you worked on and the time spent on each.

- **Days shown:** Monday to Friday by default. Tick **Show weekends** to include Saturday and Sunday. The app remembers this setting.
- **Navigation:** use **Prev** and **Next** to move between weeks, and **This week** to jump back to the current one.
- **Day totals:** each day's header shows the total time tracked that day. Today is highlighted, and a running timer's task has a green outline.
- **Weekly breakdown:** below the calendar, each task's total for the week is listed, along with a **Week total**. These totals always include Saturday and Sunday, even when weekends are hidden.

### Copy a day's tasks

Each day with tracked time has a **Copy** button under the date. It copies that day's tasks to your clipboard, one per line, ready to paste into a timesheet or status update:

```
Design review - 2.5
Email - 0.2
```

- Time is shown in hours, rounded **up** to the nearest tenth of an hour, with one decimal place.
- Whole hours have no decimal, for example `2` instead of `2.0`.
- Because each task is rounded separately, the lines can add up to slightly more than the day total shown in the header.

### Add time manually

Forgot to start the timer? Press the **+** button at the bottom of any day to add time by hand.

1. Enter the task name. Existing task names are suggested as you type.
2. Enter the hours and minutes.
3. Press **Add**.

The time is added to that day on the Week tab. If the name matches an existing task, the time is added to it. Otherwise a new task is created, and it appears in the Today view when the day is today. You can then press **Start** on it to keep tracking.

## Your data

- **Stored in your browser:** everything is saved in your browser's local storage on your own computer. Nothing is uploaded or shared.
- **Separate for each person, browser, and location:** different people, different browsers, and different addresses for the app each have their own separate data. A teammate can't see your tasks, and opening the app from a new address starts empty.
- **Timers keep counting:** if you close the app while a timer is running, the timer keeps counting real elapsed time. When you reopen the app, it shows the full time.
- **Clearing browser data erases your history.** There's no backup or export yet, so avoid clearing site data for this app if you want to keep your history.

## Light and dark mode

The app follows your system's light or dark setting automatically, and it works on phone-sized screens.

## For developers

The app is plain HTML, CSS, and JavaScript, with no build step or dependencies.

```
index.html     page layout and dialogs
styles.css     all styles
js/state.js    storage, time helpers, start and stop
js/timer.js    Timer tab: Today and Totals views, edit dialog
js/week.js     Week tab: calendar, copy, manual add
js/main.js     tab switching and startup
```

The scripts are loaded as plain `<script>` tags, in the order above, and share variables and functions. Keep that order when adding files.

To run it locally, open `index.html` directly, or serve the folder with any static file server:

```bash
python3 -m http.server 8000
```

It can be hosted as-is on any static host, including GitHub Pages.
