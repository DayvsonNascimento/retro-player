import { useStore } from '../store';

const NAV_ITEMS = [
  { id: 'now-playing', label: 'Now\nPlaying' },
  { id: 'media-guide', label: 'Media\nGuide' },
  { id: 'copy-cd', label: 'Copy\nfrom CD' },
  { id: 'media-library', label: 'Media\nLibrary' },
  { id: 'radio-tuner', label: 'Radio\nTuner' },
  { id: 'copy-device', label: 'Copy to CD\nor Device' },
  { id: 'skin-chooser', label: 'Skin\nChooser' },
];

export default function NavPanel() {
  const activeNav = useStore((s) => s.activeNav);
  const setActiveNav = useStore((s) => s.setActiveNav);

  return (
    <nav className="wmp-nav">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          className={`wmp-nav-item ${activeNav === item.id ? 'active' : ''}`}
          onClick={() => setActiveNav(item.id)}
        >
          {item.label.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i === 0 && item.label.includes('\n') ? <br /> : null}
            </span>
          ))}
        </button>
      ))}
    </nav>
  );
}
