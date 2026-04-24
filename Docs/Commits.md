**Please not that there are IDE equivalents to all these commands**

# Step 1: Keep Your Work as One Commit

You have two options to ensure your branch has only one commit before moving forward.

## Option A: Continuous Amendment

Use this to keep your branch clean as you go.

```bash
# Add your changes
git add .

# Overwrite your previous commit instead of creating a new one
git commit --amend --no-edit
```

---

## Option B: Reset and Collapse

Use this if you have already made multiple commits and need to squash them into one.

```bash
# 1. See how many commits you've made (e.g., you see 3)
git log --oneline

# 2. Reset back by that number
git reset --soft HEAD~3

# 3. Commit everything as one fresh block
git commit -m "Your descriptive commit message"
```

---

# Step 2: Sync with Dev (Rebase)

This step pulls the latest changes from `dev` and places your single commit on top of them.
This helps prevent merge conflicts later.

```bash
# 1. Update your local dev branch
git checkout dev
git fetch
git pull

# 2. Rebase your feature branch
git checkout feature-branch-name
git rebase -i dev
```

Note:
If the editor opens or conflicts appear, resolve them using your code editor’s interactive rebase tools.

---

# Step 3: Push and Open Merge Request

```bash
# Update remote branch
git push
```

If a Merge Request is already open, your history change requires a force push to update the remote branch.

```bash
# Safely update the remote branch
git push origin feature-branch-name --force-with-lease
```

---

# Step 4: Final Merge in Browser

Once your branch is rebased and pushed:

* Go to the Pull Request in your browser
* Ensure the target branch is set to `dev` (or appropriate branch)
* Confirm:

  * All checks have passed
  * Required approvals are met
* Click Merge
