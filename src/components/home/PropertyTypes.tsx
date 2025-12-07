import { Building2, Home, Building, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

const propertyTypes = [
  {
    icon: Building2,
    name: "Apartments",
    count: "250+ Properties",
    gradient: "from-primary to-primary-dark",
    image: "https://cdn.pixabay.com/photo/2020/03/09/23/59/buildings-4917447_1280.jpg",
    queryValue: "apartment",
  },
  {
    icon: Home,
    name: "Villas",
    count: "120+ Properties",
    gradient: "from-secondary to-secondary-light",
    image: "https://cdn.pixabay.com/photo/2013/10/12/18/05/villa-194671_1280.jpg",
    queryValue: "villa",
  },
  {
    icon: Building,
    name: "Penthouses",
    count: "45+ Properties",
    gradient: "from-accent to-amber-600",
    image: "https://ca-times.brightspotcdn.com/dims4/default/10b8be4/2147483647/strip/true/crop/4953x3297+0+0/resize/1200x799!/quality/75/?url=https%3A%2F%2Fcalifornia-times-brightspot.s3.amazonaws.com%2F48%2Ffa%2F5a98669e438d9b4f47135b5afb04%2F8899-beverly-v3-fullres-34.jpg",
    queryValue: "penthouse",
  },
  {
    icon: Store,
    name: "Commercial",
    count: "85+ Properties",
    gradient: "from-emerald-500 to-teal-600",
    image: "https://cdn.pixabay.com/photo/2020/11/10/10/06/business-5729164_1280.jpg",
    queryValue: "commercial",
  },
];

const PropertyTypes = () => {
  const navigate = useNavigate();

  const handleNavigate = (type: string) => {
    const params = new URLSearchParams();
    params.set("type", type);
    navigate(`/buy?${params.toString()}`);
  };

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-background">
      <div className="container-custom px-3 sm:px-4">
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 font-heading">
            Explore by <span className="text-gradient-primary">Property Type</span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl mx-auto px-2">
            Find your perfect property from our diverse collection
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {propertyTypes.map((type, index) => (
            <Card
              key={index}
              className="group cursor-pointer hover-lift border-0 shadow-lg overflow-hidden"
              onClick={() => handleNavigate(type.queryValue)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleNavigate(type.queryValue);
                }
              }}
            >
              <CardContent className="p-0">
                {/* Image Section with Icon Overlay */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={type.image} 
                    alt={type.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {/* Gradient Overlay for better text contrast */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${type.gradient} opacity-40`}></div>
                  {/* Icon on top of image */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <type.icon className="h-16 w-16 text-white drop-shadow-lg" />
                  </div>
                </div>
                
                {/* Text Section */}
                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {type.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{type.count}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PropertyTypes;
