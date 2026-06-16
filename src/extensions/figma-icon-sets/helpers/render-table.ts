/**
 * Render a minimal aligned text table with box-drawing borders.
 *
 * Cells are expected to be plain ASCII (prefixes, status words, counts) so that
 * `string.length` matches the rendered width. Avoid emoji inside cells, it would
 * break column alignment; use the surrounding log/box output for emphasis.
 */
export function renderTable(headers: string[], rows: string[][]): string {
  const widths = headers.map((header, columnIndex) => {
    return Math.max(
      header.length,
      ...rows.map((row) => row[columnIndex]?.length ?? 0),
    )
  })

  const padCell = (text: string, width: number) => {
    return text + ' '.repeat(width - text.length)
  }

  const renderRow = (cells: string[]) => {
    return `│ ${cells
      .map((cell, columnIndex) => padCell(cell ?? '', widths[columnIndex]))
      .join(' │ ')} │`
  }

  const renderBorder = (left: string, middle: string, right: string) => {
    return `${left}${widths
      .map((width) => '─'.repeat(width + 2))
      .join(middle)}${right}`
  }

  return [
    renderBorder('┌', '┬', '┐'),
    renderRow(headers),
    renderBorder('├', '┼', '┤'),
    ...rows.map(renderRow),
    renderBorder('└', '┴', '┘'),
  ].join('\n')
}
