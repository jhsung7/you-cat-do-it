# Branch and push guide

This repository currently has a single local branch (`work`) and no Git remote configured. If you see messages like:

```
$ git checkout main
M backend/package-lock.json
M backend/server.js
D frontend/dist/assets/AIChat-Bbk8YOur.js
...
Already on 'main'
Your branch is up to date with 'origin/main'.
```

it means you are on a branch named `main` that differs from the cleanup changes on `work`, or `main` may not exist locally yet. Use the steps below to view the cleanup, align branches, and push to GitHub.

> ✅ Quick answer for the GitHub branches screen you shared: push `work` to the remote and open a PR into `main`.
>
> ```bash
> git remote add origin <YOUR_REPO_URL>   # only if origin is missing
> git push -u origin work                 # make the cleaned branch visible
> # then open a Pull Request from work -> main on GitHub and merge it
> ```

The detailed steps below explain how to verify branches and avoid force pushes.

## 1) Verify your current branch and available branches
```
$ git status -sb
$ git branch -vv
```
If you only see `work`, create `main` from it:
```
$ git switch -c main work
```

## 2) Make `main` match the cleaned files from `work`
If `main` already exists and shows the `M`/`D` entries above, fast-forward it to `work`:
```
$ git checkout main
$ git merge --ff-only work
```
If `main` does not exist yet, the `git switch -c main work` command above already created it pointing at `work`.

## 3) Add your GitHub remote
Replace `<YOUR_REPO_URL>` with your repository URL:
```
$ git remote add origin <YOUR_REPO_URL>
```
You can verify with `git remote -v`.

## 4) Push the branch you want to see on GitHub
- To view the cleanup directly on GitHub without merging: `git push origin work` and switch to the `work` branch on GitHub.
- To make `main` include the cleanup: first update `main` as in step 2, then `git push origin main`.

## 5) Optional: open a Pull Request
If both branches exist on GitHub, open a PR from `work` into `main` to review and merge the cleanup safely.

## Quick checklist
- [ ] You are on the branch you expect (`git status -sb`).
- [ ] `git branch -vv` shows `main` pointing to the same commit as `work` if you want them to match.
- [ ] `git remote -v` lists your GitHub repository.
- [ ] You pushed the correct branch (`git push origin <branch>`).
