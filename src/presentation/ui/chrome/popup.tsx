import { render } from 'preact';
import { HistoryApp } from '@/presentation/ui/popup/HistoryApp';

const root = document.getElementById('app');
if (root) {
    render(<HistoryApp />, root);
}
