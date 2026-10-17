import { NeedView } from '../need-view';

/** need/[id] (screens.md P1 #3) as a static page: /need/?id=<category>[&view=list|area|map]. */
export default function NeedPage() {
  return <NeedView defaultView="list" />;
}
