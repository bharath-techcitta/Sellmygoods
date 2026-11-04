# Reverting Procurio dashboard charts

Charts were added as **optional UI** in dedicated files. You can roll back in two ways.

## Quick off (keep code, hide charts)

In the browser console:

```js
localStorage.setItem('procurio_charts', 'off');
location.reload();
```

To turn charts back on:

```js
localStorage.removeItem('procurio_charts');
location.reload();
```

Or set `VITE_ENABLE_CHARTS=false` in Vercel / `.env` and redeploy the frontend.

## Full code revert (restore pre-chart dashboards)

1. Delete folder: `frontend/src/components/charts/`
2. Remove chart imports and `{isChartsEnabled() && ...}` blocks from:
   - ~~`frontend/src/pages/admin/AdminDashboard.jsx`~~ (admin dashboard charts removed)
   - `frontend/src/pages/admin/BudgetSpendReports.jsx`
   - `frontend/src/pages/admin/AiAnalysisDashboard.jsx`
   - `frontend/src/pages/buyer/BuyerDashboard.jsx`
3. Delete this file (`CHARTS_REVERT.md`) if you no longer need it.

Or, if these changes were committed together: `git revert <commit-hash>`.

## Files added for charts

- `frontend/src/components/charts/*` (all chart components + `chartsEnabled.js`)
- Integrations in the four dashboard pages listed above
