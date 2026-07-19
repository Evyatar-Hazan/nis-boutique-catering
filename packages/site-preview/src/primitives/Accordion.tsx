import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface AccordionItem {
  readonly answer: string;
  readonly id: string;
  readonly question: string;
}

export interface AccordionProps {
  readonly allowMultiple?: boolean;
  readonly items: readonly AccordionItem[];
}

export const Accordion = ({ allowMultiple = false, items }: AccordionProps) => {
  const instanceId = useId();
  const [openIds, setOpenIds] = useState<readonly string[]>([]);
  const toggle = (id: string) => setOpenIds((current) => current.includes(id)
    ? current.filter((itemId) => itemId !== id)
    : allowMultiple ? [...current, id] : [id]);
  return (
    <div className="accordion">
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        const triggerId = `${instanceId}-${item.id}-trigger`;
        const panelId = `${instanceId}-${item.id}-panel`;
        return (
          <div className="accordion__item" key={item.id}>
            <h3>
              <button id={triggerId} type="button" aria-expanded={isOpen} aria-controls={panelId} onClick={() => toggle(item.id)}>
                {item.question}<ChevronDown aria-hidden="true" />
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={triggerId} hidden={!isOpen}><p>{item.answer}</p></div>
          </div>
        );
      })}
    </div>
  );
};
