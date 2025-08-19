import Image from "next/image";
import Link from "next/link";
import AnimationContainer from "./global/animation-container";
import Images from "./global/images";
import Wrapper from "./global/wrapper";
import { Button } from "./ui/button";
import Marquee from "./ui/marquee";
import SectionBadge from "./ui/section-badge";

const Hero = () => {

  const companies = [
    Images.comp1,
    Images.comp2,
    Images.comp3,
    Images.comp4,
    Images.comp5,
    Images.comp6,
  ];

  return (
    <Wrapper className="pt-20 lg:pt-32 relative min-h-screen w-full h-full flex-1">
      <div className="flex flex-col lg:flex-row w-full h-full lg:gap-16">
        <div className="flex flex-col items-start gap-10 py-8 w-full">
          <div className="flex flex-col items-start gap-4">
            <AnimationContainer animation="fadeUp" delay={0.2}>
              <SectionBadge title="Serving Athens & Greater Area Since 2020" />
            </AnimationContainer>

            <AnimationContainer animation="fadeUp" delay={0.4}>
              <h1 className="text-5xl lg:text-6xl font-medium leading-tight! text-transparent bg-clip-text bg-linear-to-r from-foreground to-neutral-500">
                Find Your Ideal Property in Greece
              </h1>
            </AnimationContainer>

            <AnimationContainer animation="fadeUp" delay={0.6}>
              <p className="text-sm md:text-base lg:text-lg text-muted-foreground">
                Expert real estate services in Athens and surrounding areas. From property search to Golden Visa assistance, we help you navigate the Greek property market with confidence.
              </p>
            </AnimationContainer>
          </div>

          <AnimationContainer animation="fadeUp" delay={0.8}>
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <Link href="/properties">
                <Button size="md" className="w-full sm:w-auto">
                  Browse Properties
                </Button>
              </Link>
              <Link href="/golden-visa">
                <Button
                  variant="outline"
                  size="md"
                  className="w-full sm:w-auto border-yellow-600 text-yellow-600 hover:bg-yellow-600 hover:text-white"
                >
                  ⭐ Golden Visa Program
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>💡 From €250K investment</span>
              <span>•</span>
              <span>🇪🇺 EU Residency</span>
              <span>•</span>
              <span>⏱️ 40-60 days</span>
            </div>
          </AnimationContainer>

          <AnimationContainer animation="fadeUp" delay={1}>
            <div className="flex flex-col items-start gap-4 py-4">
              <p className="text-sm md:text-base text-muted-foreground">
                Trusted by Industry Leaders
              </p>
              <div className="w-full relative max-w-[calc(100vw-2rem)] lg:max-w-lg">
                <Marquee className="[--duration:40s] select-none [--gap:2rem]">
                  {[...Array(10)].map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-center text-muted-foreground h-16"
                    >
                      {companies[index % companies.length]({
                        className: "w-auto h-5",
                      })}
                    </div>
                  ))}
                </Marquee>
                <div className="pointer-events-none absolute inset-y-0 -right-1 w-1/3 bg-linear-to-l from-[#101010] z-40"></div>
                <div className="pointer-events-none absolute inset-y-0 -left-1 w-1/3 bg-linear-to-r from-[#101010] z-40"></div>
              </div>
            </div>
          </AnimationContainer>
        </div>

        <AnimationContainer animation="fadeRight" delay={0.4}>
          <div className="flex flex-col items-start justify-start w-full h-min relative overflow-visible">
            <div className="lg:aspect-[1.3884514435695539/1] w-full lg:w-[1000px] lg:h-[auto,720px] relative">
              <div className="pointer-events-none hidden lg:block absolute inset-y-0 right-1/4 w-1/3 h-full bg-linear-to-l from-background z-50"></div>
              <div className="lg:absolute lg:inset-0">
                <Image
                  src="/images/dashboard.png"
                  alt="hero"
                  sizes="1000px"
                  width={1024}
                  height={1024}
                  className="object-contain min-w-full h-auto rounded-xl lg:rounded-2xl"
                />
              </div>
            </div>
          </div>
        </AnimationContainer>
      </div>
      <AnimationContainer
        animation="scaleUp"
        delay={1.2}
        className="absolute w-2/3 h-auto -top-[8%] left-1/4 -z-10"
      >
        <Image
          src="/images/hero-gradient.svg"
          alt="hero"
          width={1024}
          height={1024}
          className="object-cover w-full h-auto"
        />
      </AnimationContainer>
    </Wrapper>
  );
};

export default Hero;
