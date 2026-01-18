---
name: make-issue
description: Create GitHub issues from ui-skills review results or feature requests.
---

# Make Issue Skill

Create GitHub issues from two sources:
1. **UI Skills review results** - Create issues from ui-skills violations found in the conversation
2. **Feature requests** - Create general feature/improvement issues from conversation context

## How to use

### UI Skills Review Mode

- `/make-issue` or `/make-issue ui-skills`  
  Create a GitHub issue from ui-skills review results in the current conversation.

### Feature Issue Mode

- `/make-issue feature "Title" "Description"`  
  Create a feature issue with the specified title and description.

- Or simply ask: "Create an issue for [feature description]"  
  The skill will extract the feature requirements from the conversation and create an issue.

## Process

### UI Skills Review Mode

1. **Collect review results**: Extract all ui-skills violations from the conversation
2. **Organize violations**: Group violations by category and priority
3. **Generate issue content**: Create title, body, and labels
4. **Create GitHub issue**: Use `gh` CLI to create the issue

### Feature Issue Mode

1. **Extract requirements**: Parse conversation for feature requirements
2. **Identify related files**: Find files that need to be modified
3. **Generate issue content**: Create title, body with description, implementation plan, and checklist
4. **Create GitHub issue**: Use `gh` CLI to create the issue

## Issue Structure

### UI Skills Review Mode

#### Title Format
```
Fix UI Skills violations: [summary of main violations]
```

#### Body Format
```markdown
## Summary
[Brief summary of violations found]

## Violations by Category

### [Category Name] (Priority: [High/Medium/Low])

#### [Violation Title]
- **File**: `path/to/file.tsx`
- **Line**: [line number]
- **Issue**: [description]
- **Fix**: [code suggestion]

...

## Priority Summary

### High Priority
- [ ] [Violation 1]
- [ ] [Violation 2]

### Medium Priority
- [ ] [Violation 3]

### Low Priority
- [ ] [Violation 4]
```

### Feature Issue Mode

#### Title Format
```
[Feature name or improvement description]
```

#### Body Format
```markdown
## Description
[Detailed description of the feature or improvement]

## Implementation Plan
- [ ] [Step 1]
- [ ] [Step 2]
- [ ] [Step 3]

## Related Files
- `path/to/file1.tsx`
- `path/to/file2.tsx`

## Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
```

### Labels
既存のラベルを使用：
- `enhancement` (改善・機能追加)
- `help wanted` (アクセシビリティ違反がある場合)

ラベルが存在しない場合は、ラベルなしでissueを作成します。

## Implementation Steps

### UI Skills Review Mode

1. Parse conversation history for ui-skills review results
2. Extract violations with file paths, line numbers, and descriptions
3. Categorize violations by type (Stack, Components, Interaction, Typography, Layout, Performance, Design)
4. Prioritize violations (High: accessibility/UX, Medium: maintainability, Low: best practices)
5. Format issue content using the UI Skills review template
6. Execute `gh issue create` command with appropriate flags

### Feature Issue Mode

1. Parse conversation for feature requirements and context
2. Identify related files and components
3. Create implementation plan and checklist
4. Format issue content using the feature issue template
5. Execute `gh issue create` command with appropriate flags

## Example Commands

### UI Skills Review Mode

```bash
# ラベルなしで作成（ラベルは後で追加可能）
gh issue create \
  --title "Fix UI Skills violations in examples/react" \
  --body "[formatted body]"

# 既存のラベルを使用する場合
gh issue create \
  --title "Fix UI Skills violations in examples/react" \
  --body "[formatted body]" \
  --label "enhancement,help wanted"
```

### Feature Issue Mode

```bash
# 機能issueを作成
gh issue create \
  --title "カレンダーコンポーネントの追加" \
  --body "[formatted body]" \
  --label "enhancement"
```

## Notes

### UI Skills Review Mode

- Only create issues if violations are found
- Group similar violations together
- Include code snippets for clarity
- Reference specific file paths and line numbers
- Provide actionable fixes
- See `.cursor/skills/make-issue/create-issue.md` for detailed UI Skills review issue format

### Feature Issue Mode

- Extract clear requirements from conversation
- Include implementation plan and checklist
- Reference related files and components
- Define acceptance criteria
- Use appropriate labels (`enhancement` for new features)- See `.cursor/skills/make-issue/feature-issue-template.md` for detailed feature issue format
