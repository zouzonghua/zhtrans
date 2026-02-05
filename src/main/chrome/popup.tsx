import { render } from 'preact';
import { HistoryApp } from '@/presentation/components/popup/HistoryApp';

const root = document.getElementById('app');
if (root) {
    render(<HistoryApp />, root);
}
