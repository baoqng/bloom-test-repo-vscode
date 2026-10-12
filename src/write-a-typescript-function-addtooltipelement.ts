// bloom-deps:

export function addTooltip(element: HTMLElement, tooltipText: string): () => void {
  const tooltip = document.createElement('div');
  tooltip.className = 'bloom-tooltip';
  tooltip.textContent = tooltipText;
  
  document.body.appendChild(tooltip);
  
  const rect = element.getBoundingClientRect();
  tooltip.style.position = 'absolute';
  tooltip.style.left = `${rect.left}px`;
  tooltip.style.top = `${rect.bottom}px`;
  
  return () => {
    document.body.removeChild(tooltip);
  };
}