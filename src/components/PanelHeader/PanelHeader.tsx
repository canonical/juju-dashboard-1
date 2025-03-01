import type { ReactNode } from "react";

import { useQueryParams } from "hooks/useQueryParams";

type Props = {
  id: string;
  title: ReactNode;
};

export default function PanelHeader({ title, id }: Props): JSX.Element {
  const [, setPanelQs] = useQueryParams({
    panel: null,
    model: null,
  });

  return (
    <div className="p-panel__header">
      <div className="p-panel__title" id={id}>
        {title}
      </div>
      <div className="p-panel__controls">
        <button
          onClick={() => setPanelQs(null, { replace: true })}
          className="p-button--base js-aside-close u-no-margin--bottom has-icon"
        >
          <i className="p-icon--close"></i>
        </button>
      </div>
    </div>
  );
}
