// COMPONENTE DE DEBUG - AGREGAR TEMPORALMENTE A App.jsx

const ScrollDebugInfo = ({ navRef }) => {
  const [scrollInfo, setScrollInfo] = useState({});
  
  useEffect(() => {
    if (!navRef.current) return;
    
    const updateScrollInfo = () => {
      const nav = navRef.current;
      setScrollInfo({
        clientHeight: nav.clientHeight,
        scrollHeight: nav.scrollHeight,
        scrollTop: nav.scrollTop,
        needsScroll: nav.scrollHeight > nav.clientHeight,
        canScrollDown: nav.scrollTop < nav.scrollHeight - nav.clientHeight,
        screenSize: `${window.innerWidth}x${window.innerHeight}`
      });
    };
    
    updateScrollInfo();
    const interval = setInterval(updateScrollInfo, 1000);
    nav.addEventListener('scroll', updateScrollInfo);
    window.addEventListener('resize', updateScrollInfo);
    
    return () => {
      clearInterval(interval);
      nav.removeEventListener('scroll', updateScrollInfo);
      window.removeEventListener('resize', updateScrollInfo);
    };
  }, [navRef]);
  
  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white p-2 rounded text-xs z-[100] lg:hidden">
      <div>📱 {scrollInfo.screenSize}</div>
      <div>📏 Content: {scrollInfo.scrollHeight}px</div>
      <div>📐 Container: {scrollInfo.clientHeight}px</div>
      <div>🔄 Scroll: {Math.round(scrollInfo.scrollTop || 0)}px</div>
      <div>
        {scrollInfo.needsScroll ? 
          (scrollInfo.canScrollDown ? '✅ SCROLL OK' : '⚠️ EN EL FONDO') : 
          '❌ NO SCROLL'}
      </div>
    </div>
  );
};

// USAR ASÍ EN EL SIDEBAR:
// const navRef = useRef(null);
// <div ref={navRef} className="sidebar-nav custom-scrollbar flex-1 min-h-0">
// <ScrollDebugInfo navRef={navRef} />
