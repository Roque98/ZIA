# Claude Code — Comandos y workflows del proyecto ZIA

## Comandos frecuentes

### Ver estado del proyecto
```bash
git log --oneline --graph --all
git status
```

### Iniciar nueva feature (gitflow)
```bash
git checkout develop
git checkout -b feature/<nombre>
# ... trabajar ...
git checkout develop
git merge --no-ff feature/<nombre>
git branch -d feature/<nombre>
```

### Crear release (gitflow)
```bash
git checkout develop
git checkout -b release/<version>
# bump version, last fixes
git checkout main
git merge --no-ff release/<version>
git tag -a v<version> -m "Release <version>"
git checkout develop
git merge --no-ff release/<version>
git branch -d release/<version>
```

### Hotfix (gitflow)
```bash
git checkout main
git checkout -b hotfix/<nombre>
# fix
git checkout main
git merge --no-ff hotfix/<nombre>
git checkout develop
git merge --no-ff hotfix/<nombre>
git branch -d hotfix/<nombre>
```

## Contexto de sesión recomendado
Al iniciar una sesión de trabajo, leer:
1. `CLAUDE.md` — reglas del proyecto
2. `docs/client-brief.md` — contexto del cliente
3. `git log --oneline -10` — estado reciente
