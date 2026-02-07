import { SearchIcon, LoadingIcon } from '@/presentation/ui/shared/icons';

interface TriggerProps {
  x: number;
  y: number;
  isLoading: boolean;
  onMouseDown: (e: MouseEvent) => void;
}

/**
 * 划词触发图标组件
 */
export const Trigger = ({ x, y, isLoading, onMouseDown }: TriggerProps) => (
  <div
    className={`linxtrans-trigger ${isLoading ? 'linxtrans-trigger--loading' : ''}`}
    style={{ left: x, top: y }}
    onMouseDown={onMouseDown}
  >
    {isLoading ? <LoadingIcon /> : <SearchIcon />}
  </div>
);
