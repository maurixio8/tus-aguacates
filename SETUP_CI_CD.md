# Configuración de GitHub Secrets para CI/CD

## 📋 Instrucciones para configurar los secrets

### Paso 1: Obtener el VERCEL_TOKEN

1. Ve a https://vercel.com/account/tokens
2. Clic en "Create Token"
3. Nombre: `GitHub Actions CI/CD`
4. Permisos: "Full Account" o al menos "Scope: Deployments"
5. Copia el token (se muestra solo una vez)

### Paso 2: Obtener VERCEL_ORG_ID y VERCEL_PROJECT_ID

Estos valores ya fueron detectados en tu proyecto:

```
VERCEL_ORG_ID: team_GyEbmVkCpTiCbgZVzW5VMSl2
VERCEL_PROJECT_ID: prj_o7aCXapzEENDFZTvqROFW2I1iOT8
```

### Paso 3: Configurar los Secrets en GitHub

1. Ve a: https://github.com/maurixio8/tus-aguacates/settings/secrets/actions

2. Agrega los siguientes secrets (clic en "New repository secret"):

   **Secret 1: VERCEL_TOKEN**
   - Name: `VERCEL_TOKEN`
   - Value: [Pegar el token obtenido en el Paso 1]
   - Clic en "Add secret"

   **Secret 2: VERCEL_ORG_ID**
   - Name: `VERCEL_ORG_ID`
   - Value: `team_GyEbmVkCpTiCbgZVzW5VMSl2`
   - Clic en "Add secret"

   **Secret 3: VERCEL_PROJECT_ID**
   - Name: `VERCEL_PROJECT_ID`
   - Value: `prj_o7aCXapzEENDFZTvqROFW2I1iOT8`
   - Clic en "Add secret"

### Paso 4: Verificar la configuración

Después de configurar los secrets y hacer push del código, verifica el workflow en:

https://github.com/maurixio8/tus-aguacates/actions

Deberías ver el workflow "CI/CD Pipeline" ejecutándose.

## 🚀 ¿Cómo funciona el CI/CD?

Cada vez que hagas `git push` a la rama `main`:

1. ✅ **Lint & Type Check** - Verifica el código TypeScript
2. 🧪 **E2E Tests** - Ejecuta tests de Playwright
3. 🏗️ **Build** - Construye la aplicación
4. 🚀 **Deploy** - Despliega automáticamente a Vercel
5. 🕵️ **Smoke Tests** - Verifica que el deploy funcione

## 📊 Monitoreo

- Ver workflows: https://github.com/maurixio8/tus-aguacates/actions
- Ver deploy en Vercel: https://vercel.com/mauricio-s-projects-2bf4b7a2/tus-aguacates/deployments

## ⚙️ Opcional: Instalar GitHub CLI (para automatizar)

Si quieres automatizar la configuración de secrets en el futuro:

```bash
# En Windows (chocolatey)
choco install gh

# O descargar desde: https://github.com/cli/cli/releases

# Luego autenticarse
gh auth login

# Configurar secrets automáticamente
gh secret set VERCEL_TOKEN
gh secret set VERCEL_ORG_ID -b "team_GyEbmVkCpTiCbgZVzW5VMSl2"
gh secret set VERCEL_PROJECT_ID -b "prj_o7aCXapzEENDFZTvqROFW2I1iOT8"
```
