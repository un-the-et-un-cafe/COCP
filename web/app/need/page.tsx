import { NeedView } from '../need-view';

/** need/[id] (screens.md P1 #3, #5) as a static page: /need/?id=<category>&view=area|map&zone=. */
export default function NeedPage() {
  return <NeedView />;
}
