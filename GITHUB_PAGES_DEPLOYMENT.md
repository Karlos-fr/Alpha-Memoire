# GitHub Pages Deployment

This repository is configured to deploy the web app to GitHub Pages through
GitHub Actions.

In the GitHub repository settings:

```text
Settings > Pages > Source > GitHub Actions
```

Every push to `master` builds and publishes:

```text
dist/
```

Public URL:

```text
https://karlos-fr.github.io/Alpha-Memoire/
```

The production build uses the `/Alpha-Memoire/` base path so public assets are
loaded from:

```text
https://karlos-fr.github.io/Alpha-Memoire/assets/
```
