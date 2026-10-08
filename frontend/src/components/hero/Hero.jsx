import React from "react";
import heroBg from "../../assets/png/hero.webp";

// Desktop: text centered on the left over the photo.
// Mobile (<768px): taller hero, photo shifted so the phone stays visible, and the
// text sits at the bottom on a dark fade that blends into the page (#050811).
const Hero = () => (
  <section className="relative w-full h-[56vw] max-h-[999px] min-h-[520px] max-md:h-[78vh] max-md:min-h-[460px] max-md:max-h-[680px] overflow-hidden">
    {/* Background image */}
    <img
      src={heroBg}
      alt=""
      aria-hidden="true"
      className="absolute inset-0 w-full h-full object-cover object-center max-md:object-[70%_center]"
      style={{ mixBlendMode: "screen" }}
    />

    {/* Gradient layers */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `
          linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.44) 100%),
          linear-gradient(72.96deg, rgba(10,13,30,0.85) 0%, transparent 60%),
          linear-gradient(rgba(74,71,147,0.2), rgba(74,71,147,0.2))
        `,
      }}
    />
    {/* Mobile: dark fade behind the text, ending in the page base color */}
    <div className="md:hidden absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-[#050811] via-[#050811]/80 to-transparent" />

    {/* Text content */}
    <div className="absolute inset-0 z-10 flex flex-col justify-center pt-[4%] px-[6.25%] max-md:justify-end max-md:pt-0 max-md:pb-10 max-md:px-5">
      <h1
        style={{
          margin: 0,
          color: "#ffffff",
          fontFamily: "'Roboto', sans-serif",
          fontWeight: 500,
        }}
        className="text-[clamp(2rem,3.33vw,64px)] tracking-[0.02em] leading-[1.03] max-md:text-[2rem] max-md:leading-[1.1] max-md:tracking-normal"
      >
        Lorem ipsum dolor sit amet.
      </h1>
      <p
        style={{
          marginTop: "16px",
          marginBottom: 0,
          fontFamily: "'Roboto', sans-serif",
          fontWeight: 400,
        }}
        className="text-[#ededee] text-[clamp(1rem,1.25vw,24px)] max-w-[min(651px,34vw)] leading-[1.17] max-md:mt-3 max-md:text-[15px] max-md:leading-[1.5] max-md:max-w-[34ch] max-md:text-[#c9d1dc]"
      >
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua.
      </p>
    </div>
  </section>
);

export default Hero;
