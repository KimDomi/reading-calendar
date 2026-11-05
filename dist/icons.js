// Shared 24px geometry for navigation and in-app controls.
const shapes={
  plans:'<path d="M12 6v15M12 6C9 4 6 3.5 3 4v15c3-.5 6 0 9 2 3-2 6-2.5 9-2V4c-3-.5-6 0-9 2Z"/>',
  done:'<path d="M4 19V5a2 2 0 0 1 2-2h12v10M4 19a2 2 0 0 1 2-2h5M4 19a2 2 0 0 0 2 2h6"/><path d="m15 18 2 2 4-5"/>',
  timer:'<circle cx="12" cy="12" r="9"/><path d="M12 3v9h9"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18"/>',
  settings:'<path d="m9 3-.5 2-2 .9-1.9-.5-2 3.4 1.5 1.5v2.4L2.6 14l2 3.4 1.9-.5 2 .9L9 20h4l.5-2.2 2-.9 1.9.5 2-3.4-1.5-1.3v-2.4l1.5-1.5-2-3.4-1.9.5-2-.9L13 3Z" transform="translate(1 .5)"/><circle cx="12" cy="12" r="3"/>',
  keyboard:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M5 9h2m2 0h2m2 0h2m2 0h2M5 12h2m2 0h2m2 0h2m2 0h2M7 16h10"/>',
  folder:'<path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11H3Z"/>',
  'chevron-left':'<path d="m14 6-6 6 6 6"/>',
  'chevron-right':'<path d="m10 6 6 6-6 6"/>',
  'chevron-up':'<path d="m6 15 6-6 6 6"/>',
  'chevron-down':'<path d="m6 9 6 6 6-6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  more:'<g fill="currentColor" stroke="none"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></g>',
  grip:'<g fill="currentColor" stroke="none"><circle cx="8" cy="5" r="1.3"/><circle cx="16" cy="5" r="1.3"/><circle cx="8" cy="12" r="1.3"/><circle cx="16" cy="12" r="1.3"/><circle cx="8" cy="19" r="1.3"/><circle cx="16" cy="19" r="1.3"/></g>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4M12 17h.01"/>',
  light:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  dark:'<path d="M20.5 13A9 9 0 0 1 11 3.5 9 9 0 1 0 20.5 13Z"/>',
  system:'<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18Z" fill="currentColor" stroke="none"/>',
  play:'<path d="M9 5v14l11-7Z" fill="currentColor" stroke="none"/>',
  pause:'<path d="M7 5h4v14H7zm6 0h4v14h-4Z" fill="currentColor" stroke="none"/>'
};
export function icon(name){
  if(!Object.hasOwn(shapes,name))throw Error('Unknown icon: '+name);
  return `<svg class="ui-icon" data-icon="${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${shapes[name]}</svg>`;
}
