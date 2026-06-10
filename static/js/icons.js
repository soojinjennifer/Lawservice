
// icons.jsx — Fluent-style icon set for the legal-doc service.
// All glyphs are 20x20 viewBox; sized via the `size` prop.

window.Icon = function Icon({ name, size = 20, filled = false, color = "currentColor" }) {
  const g = {
    // navigation / utility
    home: filled
      ? <path d="M10 2 2.5 8.5V17a1 1 0 0 0 1 1H8v-5h4v5h4.5a1 1 0 0 0 1-1V8.5z" fill={color}/>
      : <g fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round"><path d="M10 2 2.5 8.5V17a1 1 0 0 0 1 1H8v-5h4v5h4.5a1 1 0 0 0 1-1V8.5z"/></g>,
    document: filled
      ? <path d="M5 2.5h7l4 4V16c0 .8-.7 1.5-1.5 1.5h-9c-.8 0-1.5-.7-1.5-1.5V4c0-.8.7-1.5 1.5-1.5z" fill={color}/>
      : <g fill="none" stroke={color} strokeWidth="1.4"><path d="M5 2.5h7l4 4V16c0 .8-.7 1.5-1.5 1.5h-9c-.8 0-1.5-.7-1.5-1.5V4c0-.8.7-1.5 1.5-1.5z"/><path d="M12 2.5v4h4"/></g>,
    docEdit: <g fill="none" stroke={color} strokeWidth="1.4"><path d="M5 2.5h6l3.5 3.5V16c0 .8-.7 1.5-1.5 1.5h-8c-.8 0-1.5-.7-1.5-1.5V4c0-.8.7-1.5 1.5-1.5z"/><path d="M11 2.5v3.5h3.5"/><path d="m6.5 12.5 3-3 1.5 1.5-3 3H6.5z"/></g>,
    help: <g fill="none" stroke={color} strokeWidth="1.4"><circle cx="10" cy="10" r="7.5"/><path d="M8 8c.2-1.3 1.1-2 2.2-2 1.2 0 2.2.8 2.2 2 0 1.7-2.2 1.7-2.2 3.2M10 14v.1"/></g>,
    person: filled
      ? <g fill={color}><circle cx="10" cy="7" r="3"/><path d="M3.5 17c.8-3 3.4-5 6.5-5s5.7 2 6.5 5z"/></g>
      : <g fill="none" stroke={color} strokeWidth="1.4"><circle cx="10" cy="7" r="3"/><path d="M3.5 17c.8-3 3.4-5 6.5-5s5.7 2 6.5 5"/></g>,
    bell: filled
      ? <path d="M10 2.5c2.8 0 5 2.2 5 5v3l1.5 2.5h-13L5 10.5v-3c0-2.8 2.2-5 5-5zM8 16h4a2 2 0 0 1-4 0z" fill={color}/>
      : <g fill="none" stroke={color} strokeWidth="1.4"><path d="M10 2.5c2.8 0 5 2.2 5 5v3l1.5 2.5h-13L5 10.5v-3c0-2.8 2.2-5 5-5z"/><path d="M8 16h4a2 2 0 0 1-4 0z"/></g>,
    settings: <g fill="none" stroke={color} strokeWidth="1.4"><circle cx="10" cy="10" r="2.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.5 4.5l1.4 1.4M14.1 14.1l1.4 1.4M4.5 15.5l1.4-1.4M14.1 5.9l1.4-1.4"/></g>,
    search: <g fill="none" stroke={color} strokeWidth="1.4"><circle cx="9" cy="9" r="5.5"/><path d="M13 13l4 4" strokeLinecap="round"/></g>,
    chevronD: <path d="M5 8l5 5 5-5" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round"/>,
    chevronR: <path d="M8 5l5 5-5 5" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round"/>,
    chevronL: <path d="M12 5l-5 5 5 5" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round"/>,
    arrowR: <path d="M4 10h12m-4-4 4 4-4 4" stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    add: <path d="M10 4v12M4 10h12" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>,
    dismiss: <path d="M5 5l10 10M15 5 5 15" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>,
    more: <g fill={color}><circle cx="5" cy="10" r="1.4"/><circle cx="10" cy="10" r="1.4"/><circle cx="15" cy="10" r="1.4"/></g>,
    check: filled
      ? <g fill={color}><circle cx="10" cy="10" r="8"/><path d="M6 10l3 3 5-6" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></g>
      : <g fill="none" stroke={color} strokeWidth="1.6"><circle cx="10" cy="10" r="7.5"/><path d="M6 10l3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/></g>,
    checkOnly: <path d="M4 10.5l4 4 8-8.5" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    sparkle: filled
      ? <path d="M10 2l1.5 4.5L16 8l-4.5 1.5L10 14l-1.5-4.5L4 8l4.5-1.5z" fill={color}/>
      : <path d="M10 2l1.5 4.5L16 8l-4.5 1.5L10 14l-1.5-4.5L4 8l4.5-1.5z" fill="none" stroke={color} strokeWidth="1.2"/>,
    send: filled
      ? <path d="M3 3l14 7-14 7 3-7zM6 10h6" fill={color}/>
      : <path d="M3 3l14 7-14 7 3-7zM6 10h6" fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round"/>,
    sendArrow: <g fill={color}><path d="M10 4v12M5 9l5-5 5 5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></g>,
    arrowUp: <path d="M10 16V4M5 9l5-5 5 5" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    trash: <g fill="none" stroke={color} strokeWidth="1.4"><path d="M3 5h14M5 5l1 12h8l1-12M8 8v6M12 8v6M7 5V3h6v2"/></g>,
    download: <g fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3v10m-4-4 4 4 4-4"/><path d="M3 15v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2"/></g>,
    upload: <g fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 14V4m-4 4 4-4 4 4"/><path d="M3 15v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2"/></g>,
    save: <g fill="none" stroke={color} strokeWidth="1.4"><path d="M3.5 4.5c0-.6.4-1 1-1H12L16.5 8v7.5c0 .6-.4 1-1 1h-11c-.6 0-1-.4-1-1z"/><path d="M6 3.5v3h7v-3M6 11h8v5H6z"/></g>,
    mail: <g fill="none" stroke={color} strokeWidth="1.4"><rect x="2.5" y="4.5" width="15" height="11" rx="1.2"/><path d="M2.5 5.5 10 10l7.5-4.5"/></g>,
    chat: <path d="M3 5c0-1 .8-1.8 1.8-1.8h10.4c1 0 1.8.8 1.8 1.8v7c0 1-.8 1.8-1.8 1.8H8L4.5 17V14H4.8c-1 0-1.8-.8-1.8-1.8z" fill="none" stroke={color} strokeWidth="1.4"/>,
    google: <g><path fill="#4285F4" d="M19 10.2c0-.6-.1-1.2-.2-1.8H10v3.4h5c-.2 1.2-.9 2.2-1.9 2.8v2.3h3.1c1.8-1.7 2.8-4.1 2.8-6.7z"/><path fill="#34A853" d="M10 19c2.6 0 4.7-.9 6.3-2.3l-3.1-2.3c-.8.6-2 .9-3.2.9-2.5 0-4.6-1.7-5.3-3.9H1.5v2.4C3 17 6.3 19 10 19z"/><path fill="#FBBC05" d="M4.7 11.4c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V5.2H1.5C.5 6.7 0 8.3 0 10s.5 3.3 1.5 4.8z"/><path fill="#EA4335" d="M10 4c1.4 0 2.7.5 3.7 1.4l2.8-2.8C14.6 1 12.4 0 10 0 6.3 0 3 2 1.5 5.2l3.2 2.4C5.4 5.4 7.5 4 10 4z"/></g>,
    kakao: <g><circle cx="10" cy="10" r="10" fill="#FEE500"/><path d="M10 5C6.7 5 4 7 4 9.6c0 1.7 1.2 3.2 3 4l-.7 2.5c-.1.2.1.4.3.3l3-1.9c.1 0 .3 0 .4 0 3.3 0 6-2 6-4.9C16 7 13.3 5 10 5z" fill="#391B1B"/></g>,
    timeline: <g fill="none" stroke={color} strokeWidth="1.4"><circle cx="5" cy="5" r="1.5"/><circle cx="5" cy="10" r="1.5"/><circle cx="5" cy="15" r="1.5"/><path d="M5 6.5v2M5 11.5v2M9 5h7M9 10h6M9 15h5"/></g>,
    plus: <path d="M10 4v12M4 10h12" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>,
    minus: <path d="M4 10h12" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>,
    lock: <g fill="none" stroke={color} strokeWidth="1.4"><rect x="4" y="9" width="12" height="8" rx="1.5"/><path d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9"/></g>,
    shield: <g fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round"><path d="M10 2.5 4 5v5c0 4 2.5 6.5 6 7.5 3.5-1 6-3.5 6-7.5V5z"/><path d="m7.5 10 2 2 3.5-4"/></g>,
    clock: <g fill="none" stroke={color} strokeWidth="1.4"><circle cx="10" cy="10" r="7.5"/><path d="M10 6v4l3 2" strokeLinecap="round"/></g>,
    gavel: <g fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round"><path d="m4 16 6-6 2 2-6 6z"/><path d="m9 9 5-5m-2-1 4 4-2 2-4-4z"/><path d="M3 18h8"/></g>,
    book: <g fill="none" stroke={color} strokeWidth="1.4"><path d="M3 4.5C5 4 7 4 10 5c3-1 5-1 7-.5V16c-2-.5-4-.5-7 .5-3-1-5-1-7-.5z"/><path d="M10 5v11.5"/></g>,
    folder: filled
      ? <path d="M2.5 6.5c0-.8.7-1.5 1.5-1.5h3.5l1.5 1.5h7c.8 0 1.5.7 1.5 1.5v6.5c0 .8-.7 1.5-1.5 1.5h-12c-.8 0-1.5-.7-1.5-1.5z" fill={color}/>
      : <path d="M2.5 6.5c0-.8.7-1.5 1.5-1.5h3.5l1.5 1.5h7c.8 0 1.5.7 1.5 1.5v6.5c0 .8-.7 1.5-1.5 1.5h-12c-.8 0-1.5-.7-1.5-1.5z" fill="none" stroke={color} strokeWidth="1.4"/>,
    rocket: <g fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round"><path d="M14 3s2 0 3 1 1 3 1 3c-2 5-7 9-7 9l-3-3s4-5 6-10z"/><path d="m11 13-1 4-4-3 3-2"/><path d="M5 12.5C3.5 14 3 17 3 17s3-.5 4.5-2"/></g>,
    bolt: filled
      ? <path d="M11 2 4 11h4l-1 7 7-9h-4l1-7z" fill={color}/>
      : <path d="M11 2 4 11h4l-1 7 7-9h-4l1-7z" fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round"/>,
    refresh: <g fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4v4h-4"/><path d="M4 16v-4h4"/><path d="M16 8a6 6 0 0 0-10.5-2M4 12a6 6 0 0 0 10.5 2"/></g>,
    eye: <g fill="none" stroke={color} strokeWidth="1.4"><path d="M1.5 10C3.5 6 6.5 4 10 4s6.5 2 8.5 6c-2 4-5 6-8.5 6S3.5 14 1.5 10z"/><circle cx="10" cy="10" r="2.5"/></g>,
    eyeOff: <g fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round"><path d="M3 10s2.5-5 7-5c1 0 2 .2 3 .6M17 10s-2.5 5-7 5c-1 0-2-.2-3-.6"/><path d="m4 4 12 12"/></g>,
    creditCard: <g fill="none" stroke={color} strokeWidth="1.4"><rect x="2" y="5" width="16" height="11" rx="1.5"/><path d="M2 9h16M4.5 12.5h4M11.5 12.5h2"/></g>,
    crown: <g fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round"><path d="m3 6 2.5 9h9L17 6l-3.5 3L10 4 6.5 9z"/></g>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" style={{ display: "inline-block", verticalAlign: "middle", flex: "none" }}>
      {g[name] || <circle cx="10" cy="10" r="2" fill={color}/>}
    </svg>
  );
};

  