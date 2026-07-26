# Token Extraction Report

Source: ./src
Generated: 2026-07-26T20:58:59.765Z

## Executive Summary

- Tokens extracted: 73
- Variable-backed tokens: 73
- Inferred tokens: 0
- Modes: default, dark
- Semantic coverage: 100/100
- Mode coverage: 100/100
- Scale health: 62/100
- Confidence: 86/100

## Token Families

| Family | Count | Modes |
|--------|-------|-------|
| color | 62 | dark, default |
| spacing | 0 | - |
| typography | 3 | dark, default |
| radius | 8 | dark, default |
| shadow | 0 | - |
| other | 0 | - |

## Semantic Coverage

Present: background, foreground, primary, secondary, accent, muted, border, ring, card, popover, destructive, input

Missing: none

## Mode Coverage

Complete mode-sensitive tokens: 62

Partial mode-sensitive tokens: 0

No missing mode-sensitive tokens detected.

## Alias Graph

- Alias edges: 41
- Resolved references: 39
- Unresolved references: 2
- Circular references: 0
- Max alias depth: 2

| Token | Missing reference |
|-------|-------------------|
| --font-mono | --font-geist-mono |
| --font-sans | --font-geist-sans |

## Duplicate Values

| Type | Value | Tokens |
|------|-------|--------|
| color | `oklch(0.985 0 0)` | --accent-foreground, --card-foreground, --foreground, --popover-foreground, --primary-foreground, --secondary-foreground, --sidebar, --sidebar-accent-foreground, --sidebar-foreground, --sidebar-primary-foreground |
| color | `oklch(0.205 0 0)` | --accent-foreground, --card, --popover, --primary, --primary-foreground, --secondary-foreground, --sidebar, --sidebar-accent-foreground, --sidebar-primary |
| color | `oklch(0.145 0 0)` | --background, --card-foreground, --foreground, --popover-foreground, --sidebar-foreground |
| color | `oklch(0.269 0 0)` | --accent, --chart-5, --muted, --secondary, --sidebar-accent |
| color | `oklch(0.556 0 0)` | --chart-2, --muted-foreground, --ring, --sidebar-ring |
| color | `oklch(0.922 0 0)` | --border, --input, --primary, --sidebar-border |
| color | `oklch(0.97 0 0)` | --accent, --muted, --secondary, --sidebar-accent |
| color | `oklch(0.708 0 0)` | --muted-foreground, --ring, --sidebar-ring |
| color | `oklch(1 0 0)` | --background, --card, --popover |
| color | `oklch(1 0 0 / 10%)` | --border, --sidebar-border |

## Recommendations

| Priority | Action | Rationale |
|----------|--------|-----------|
| high | Fix token alias graph before shipping generated CSS | 2 unresolved references and 0 cycles can break runtime styles. |
| medium | Collapse duplicate literal values into semantic aliases | 10 duplicate groups suggest raw palette tokens are leaking into semantic slots. |
| low | Use Tailwind utility patterns to prioritize token migrations | Frequently repeated utilities indicate where token adoption will remove the most design debt. |

## Notes

- 2 alias references point at missing variables
- Spacing scale is thin; expect one-off layout values
- 95 Tailwind utility patterns detected for migration planning
- 10 duplicate value groups detected
- 2 unresolved alias references detected
