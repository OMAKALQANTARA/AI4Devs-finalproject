# 🚀 Guía Rápida: Workflow de GitHub desde Cursor

## ✅ Estado Actual del Proyecto

### Creado Exitosamente:
- ✅ **4 Milestones** (Sprints 1-4)
- ✅ **20 Issues** (Todos los tickets de trabajo)
- ✅ **Labels organizados** por tipo, módulo y prioridad
- ✅ Todos los issues asignados a sus respectivos milestones

### Enlaces Directos:
- 📊 **Issues**: https://github.com/OMAKALQANTARA/AI4Devs-finalproject/issues
- 📋 **Milestones**: https://github.com/OMAKALQANTARA/AI4Devs-finalproject/milestones
- 🎯 **Project Board**: https://github.com/OMAKALQANTARA/AI4Devs-finalproject/projects

---

## 📊 Distribución de Issues por Sprint

| Sprint | Issues | Story Points | Fecha Límite |
|--------|--------|--------------|--------------|
| **Sprint 1 - Fundación** | #1-#5 | 21 | 19 Ene 2025 |
| **Sprint 2 - Mensajería Básica** | #6-#10 | 21 | 02 Feb 2025 |
| **Sprint 3 - Motor de Condiciones ⭐** | #11-#16 | 26 | 16 Feb 2025 |
| **Sprint 4 - Multimedia y UX** | #17-#20 | 21 | 02 Mar 2025 |
| **TOTAL MVP** | 20 issues | **89 SP** | 8 semanas |

---

## 🔧 Comandos Útiles desde Cursor

### Ver Issues

```bash
# Ver todos los issues
gh issue list

# Ver issues de un sprint específico
gh issue list --milestone "Sprint 1 - Fundación"

# Ver issues asignados a ti
gh issue list --assignee @me

# Ver un issue específico
gh issue view 1
```

### Trabajar en un Issue

```bash
# 1. Crear rama desde un issue
gh issue develop 1 --checkout

# O manualmente:
git checkout -b feature/UNLOKD-001-setup-proyecto

# 2. Asignarte el issue
gh issue edit 1 --add-assignee @me

# 3. Trabajar y hacer commits
git add .
git commit -m "feat(setup): configure NestJS with MySQL

- Added docker-compose.yml
- Configured Prisma
- Added health check

Related to #1"

# 4. Subir cambios
git push -u origin feature/UNLOKD-001-setup-proyecto

# 5. Crear Pull Request
gh pr create --title "[UNLOKD-001] Setup proyecto" --body "Closes #1"

# 6. Ver el PR en el navegador
gh pr view --web

# 7. Cuando esté aprobado, hacer merge
gh pr merge --squash --delete-branch
```

### Gestión de Issues

```bash
# Cerrar un issue
gh issue close 1 --comment "Completado ✅"

# Reabrir un issue
gh issue reopen 1

# Agregar comentario
gh issue comment 1 --body "Progreso: 50%"

# Agregar labels
gh issue edit 1 --add-label "in-progress"

# Cambiar milestone
gh api -X PATCH repos/OMAKALQANTARA/AI4Devs-finalproject/issues/1 -f milestone=2
```

### Ver Estado del Sprint

```bash
# Ver resumen de milestones
gh api repos/OMAKALQANTARA/AI4Devs-finalproject/milestones --jq '.[] | {title, open_issues, closed_issues}'

# Ver issues del sprint actual
gh issue list --milestone "Sprint 1 - Fundación" --state open

# Ver issues cerrados del sprint
gh issue list --milestone "Sprint 1 - Fundación" --state closed
```

### Búsqueda de Issues

```bash
# Buscar issues por label
gh issue list --label "backend"
gh issue list --label "p0-blocker"
gh issue list --label "conditions,diferenciador"

# Buscar issues por texto
gh issue list --search "autenticación"
```

---

## 🎯 Workflow Recomendado (Daily)

### 1. **Morning Check** (5 min)
```bash
# Ver issues del sprint actual
gh issue list --milestone "Sprint 1 - Fundación"

# Ver tus issues asignados
gh issue list --assignee @me --state open

# Ver PRs pendientes
gh pr list
```

### 2. **Comenzar una Tarea**
```bash
# Seleccionar un issue (ej: #1)
gh issue view 1

# Crear rama
gh issue develop 1 --checkout

# O manual:
git checkout main
git pull
git checkout -b feature/UNLOKD-001-setup-proyecto

# Asignarte el issue
gh issue edit 1 --add-assignee @me
```

### 3. **Durante el Desarrollo**
```bash
# Commits frecuentes con referencias
git commit -m "feat(setup): add docker-compose

Related to #1"

# Push regularmente
git push
```

### 4. **Finalizar la Tarea**
```bash
# Crear PR
gh pr create --title "[UNLOKD-001] Setup proyecto" \
  --body "## Cambios
- ✅ Docker Compose configurado
- ✅ Prisma configurado
- ✅ Health check

Closes #1"

# Ver PRs tuyos
gh pr status
```

### 5. **Review y Merge**
```bash
# Después de aprobación
gh pr merge --squash --delete-branch

# Volver a main
git checkout main
git pull
```

---

## 🏷️ Labels Disponibles

### Por Tipo de Trabajo:
- `backend` - Trabajo de backend
- `frontend` - Trabajo de frontend
- `database` - Trabajo de base de datos
- `testing` - Testing (unit, e2e)

### Por Módulo:
- `auth` - Autenticación
- `users` - Usuarios
- `chats` - Chats
- `messages` - Mensajes
- `conditions` - **Motor de condiciones (DIFERENCIADOR)**
- `media` - Multimedia/S3

### Por Prioridad:
- `p0-blocker` - 🔴 Crítico - Debe hacerse
- `p1-high` - 🟠 Alta prioridad
- `p2-medium` - 🟡 Prioridad media

### Especiales:
- `diferenciador` - 🌟 Funcionalidad clave diferenciadora
- `e2e` - Tests end-to-end
- `ui/ux` - Interfaz de usuario

---

## 📈 Métricas y Seguimiento

### Ver Progreso del Sprint
```bash
# Crear script: sprint-status.sh
gh api repos/OMAKALQANTARA/AI4Devs-finalproject/milestones/1 | \
  jq '{title, open_issues, closed_issues, due_on}'
```

### Burndown Manual
```bash
# Contar issues restantes por sprint
gh issue list --milestone "Sprint 1 - Fundación" --state open | wc -l
```

---

## 🔗 Enlaces Rápidos

### Comandos de Navegación
```bash
# Abrir repo en navegador
gh browse

# Abrir issues
gh browse /issues

# Abrir milestones
gh browse /milestones

# Abrir un issue específico
gh issue view 1 --web

# Abrir un PR específico
gh pr view 1 --web
```

---

## 💡 Tips y Best Practices

### Commits
- ✅ **Usar Conventional Commits**: `feat:`, `fix:`, `docs:`, `refactor:`
- ✅ **Referenciar issues**: `Related to #1`, `Closes #1`, `Fixes #1`
- ✅ **Commits pequeños y frecuentes** mejor que grandes cambios

### Pull Requests
- ✅ **Título descriptivo** con el ID del issue: `[UNLOKD-001] Setup proyecto`
- ✅ **Descripción completa**: Qué cambios, por qué, cómo probar
- ✅ **Screenshots** si hay cambios visuales
- ✅ **Usar `Closes #N`** para cerrar automáticamente el issue

### Branches
- ✅ **Nomenclatura clara**: `feature/UNLOKD-001-setup-proyecto`
- ✅ **Una branch por issue/feature**
- ✅ **Eliminar branches** después del merge
- ✅ **Mantener main actualizado**: `git pull` frecuentemente

### Issues
- ✅ **Comentar el progreso**: Actualiza el issue con avances
- ✅ **Asignarse antes de trabajar**: Evita duplicar trabajo
- ✅ **Cerrar con contexto**: Explica qué se hizo o por qué se cierra

---

## 🆘 Solución de Problemas

### "gh: command not found"
```bash
# Reinstalar GitHub CLI
winget install --id GitHub.cli --force

# Reiniciar terminal
```

### "not found" al crear issues
```bash
# Re-autenticar
gh auth login

# Verificar autenticación
gh auth status
```

### Problemas de encoding en PowerShell
```bash
# Usar comillas simples para títulos con caracteres especiales
gh issue create --title 'Título con (paréntesis)'
```

---

## 📚 Recursos Adicionales

- 📖 **Documentación GitHub CLI**: https://cli.github.com/manual/
- 📖 **Conventional Commits**: https://www.conventionalcommits.org/
- 📖 **Git Flow**: https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow
- 📖 **Scrum Guide**: https://scrumguides.org/

---

## ✅ Checklist para Iniciar Sprint 1

- [ ] Revisar los 5 issues del Sprint 1
- [ ] Asignar issues a los miembros del equipo
- [ ] Crear el tablero de GitHub Project (opcional)
- [ ] Configurar protección de la rama `main`
- [ ] Definir reglas de PR (ej: 1 aprobación mínima)
- [ ] Comenzar con UNLOKD-001 (Setup proyecto)

---

**¡Listo para comenzar el desarrollo! 🚀**

