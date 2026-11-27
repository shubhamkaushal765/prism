---
name: csv-column-summary
description: Summarizes a CSV file's columns (type, null count, min, max, and top values). Use when the user asks for a quick profile of a CSV or wants to know what a column contains. Not for editing CSV files, converting them to other formats, or files larger than 500 MB.
---

# CSV Column Summary

Profile each column of a CSV file without changing it.

## Steps

1. Confirm the path points to an existing `.csv` file. If not, stop and report the path.
2. Read the header row to get the column names.
3. For each column, count the empty cells and the non-empty cells.
4. Infer the type: `integer`, `number`, `date` (ISO 8601 only), or `text`.
5. For `integer` and `number` columns, record the minimum and maximum.
6. For `text` and `date` columns, list the five most frequent values with their counts.
7. Print the summary as a Markdown table, one row per column.

## Example output

| column | type | nulls | min | max | top values |
|---|---|---|---|---|---|
| id | integer | 0 | 1 | 9120 | |
| country | text | 3 | | | US (410), IN (231), DE (88) |

## Self-check

- The table has one row per header column.
- Each null count is at most the number of data rows.
- The source file is unchanged: its size and modification time match the values taken before the run.
