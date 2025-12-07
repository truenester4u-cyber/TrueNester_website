const developers = [
  { name: "EMAAR", logo: "/developers/emaar.png" },
  { name: "DAMAZ", logo: "/developers/damaz.png" },
  { name: "SOBHA REALTY", logo: "/developers/sobha.png" },
  { name: "AZIZI", logo: "/developers/azizi.png" },
  { name: "DANUBE", logo: "/developers/danube.png" },
  { name: "BINGHATTI", logo: "/developers/binghatti.png" },
  { name: "DEYAAR", logo: "/developers/deyaar.png" },
  { name: "ELLINGTON", logo: "/developers/ellington.png" },
  { name: "IMTIAZ", logo: "/developers/imtiaz.png" },
  { name: "SAMANA", logo: "/developers/samana.png" },
];

// Optional: override size per logo by name.
// Edit the values below to change height/width constraints for specific partners.
// Use Tailwind classes like 'h-12', 'h-16', 'h-20', and adjust max width as needed.
const logoSizeByName: Record<string, { img: string; item?: string }> = {
  // Examples — tweak freely:
  EMAAR: { img: "h-18 w-auto max-w-[140px]" },
  DAMAZ: { img: "<h-16></h-16> w-auto max-w-[120px]" },
  "SOBHA REALTY": { img: "<h-16></h-16> w-auto max-w-[130px]" },
  AZIZI: { img: "<h-16></h-16> w-auto max-w-[120px]" },
  DANUBE: { img: "<h-16></h-16> w-auto max-w-[130px]" },
  BINGHATTI: { img: "<h-12></h-12> w-auto max-w-[110px]" },
  DEYAAR: { img: "<h-10></h-10> w-auto max-w-[120px]" },
  ELLINGTON: { img: "<h-10></h-10> w-auto max-w-[120px]" },
  IMTIAZ: { img: "<h-16></h-16> w-auto max-w-[120px]" },
  SAMANA: { img: "h-9 w-auto max-w-[120px]" },
};

const defaultImgClass = "h-10 sm:h-12 w-auto max-w-[110px] sm:max-w-[120px] object-contain";
const defaultItemClass = "flex-shrink-0 flex items-center justify-center min-w-[100px] sm:min-w-[120px] py-1 sm:py-2";

const DeveloperPartners = () => {
  return (
    <section className="py-3 sm:py-4 bg-white border-t border-b">
      <div className="container-custom">
        <div className="rounded-xl border bg-white px-4 py-3 sm:px-6 sm:py-4 overflow-hidden">
          <div className="text-left mb-2">
            <p className="text-sm text-muted-foreground mb-1">Partners with</p>
            <h2 className="text-xl font-bold">
              Dubai's leading <span className="text-gradient-primary">developers</span>
            </h2>
          </div>

          {/* Infinite Scroll Container inside box */}
          <div className="relative">
            <div className="overflow-hidden">
              <div className="flex gap-4 sm:gap-8 animate-scroll items-center w-max">
            {/* First set */}
            {developers.map((developer, index) => (
              <div
                key={`first-${index}`}
                className={`${(logoSizeByName[developer.name]?.item || defaultItemClass)} opacity-80 hover:opacity-100 transition-opacity duration-300`}
              >
                <img
                  src={developer.logo}
                  alt={developer.name}
                  className={`${logoSizeByName[developer.name]?.img || defaultImgClass}`}
                  onError={(e) => {
                    // Fallback if image not found
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.parentElement;
                    if (fallback) {
                      fallback.innerHTML = `<span class="text-xl font-bold text-muted-foreground">${developer.name}</span>`;
                    }
                  }}
                />
              </div>
            ))}
           

            {/* Duplicate set for seamless loop */}
            {developers.map((developer, index) => (
              <div
                key={`second-${index}`}
                className={`${(logoSizeByName[developer.name]?.item || defaultItemClass)} opacity-70 hover:opacity-100 transition-opacity duration-350`}
              >
                <img
                  src={developer.logo}
                  alt={developer.name}
                  className={`${logoSizeByName[developer.name]?.img || defaultImgClass}`}
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.parentElement;
                    if (fallback) {
                      fallback.innerHTML = `<span class="text-xl font-bold text-muted-foreground">${developer.name}</span>`;
                    }
                  }}
                />
              </div>
            ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

export default DeveloperPartners;
