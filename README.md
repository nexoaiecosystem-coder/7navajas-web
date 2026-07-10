# 7 Navajas Barber

Web de la barbería 7 Navajas — Paso Carrasco, Montevideo. Instagram: [@7navajas.barber](https://instagram.com/7navajas.barber)

React + Vite, con sistema de reservas de turnos sobre Supabase (tabla `turnos`) y deploy automático a GitHub Pages vía GitHub Actions.

## Desarrollo local

```bash
npm install
cp .env.example .env   # completar con la URL y anon key de Supabase
npm run dev
```

## Deploy

Cada push a `main` dispara el workflow de `.github/workflows/deploy.yml`, que buildea y publica en GitHub Pages.

Requiere en el repo (Settings → Secrets and variables → Actions):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Y en Settings → Pages, Source = **GitHub Actions**.
