import React from "react";
import heroBg from "../../assets/png/hero.webp";

const Hero = () => (
  <section
    // style={{
    //   position: "relative",
    //   width: "100%",
    //   height: "56vw",
    //   maxHeight: "999px",
    //   minHeight: "520px",
    //   overflow: "hidden",
    // }}
    className="relative w-full h-[56vw] max-h-[999px] min-h-[520px] max-md:min-h-0 overflow-hidden"
  >
    {/* Background image */}
    <img
      src={heroBg}
      alt=""
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "center",
        mixBlendMode: "screen",
      }}
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

    {/* Text content */}
    <div
      // style={{
      //   position: "absolute",
      //   inset: 0,
      //   zIndex: 10,
      //   display: "flex",
      //   flexDirection: "column",
      //   justifyContent: "center",
      //   paddingTop: "4%",
      //   paddingLeft: "6.25%",
      //   paddingRight: "6.25%",
      // }}
      className="absolute inset-0 z-10 flex flex-col justify-center pt-[4%] px-[6.25%] max-md:pt-[8%] max-md:px-[5%] max-sm:pt-[12%] max-sm:px-[4%]"
    >
      <h1
        style={{
          margin: 0,
          color: "#ffffff",
          fontFamily: "'Roboto', sans-serif",
          fontWeight: 500,
          // fontSize: "clamp(2rem, 3.33vw, 64px)",
          // letterSpacing: "0.02em",
          // lineHeight: 1.03,
        }}
        className="text-[clamp(2rem,3.33vw,64px)] tracking-[0.02em] leading-[1.03] max-md:text-[clamp(1.5rem,3.33vw,48px)] max-sm:text-[clamp(1.25rem,3.33vw,24px)]"
      >
        Lorem ipsum dolor sit amet.
      </h1>
      <p
        style={{
          marginTop: "16px",
          marginBottom: 0,
          color: "#ededee",
          fontFamily: "'Roboto', sans-serif",
          fontWeight: 400,
          // fontSize: "clamp(1rem, 1.25vw, 24px)",
          // maxWidth: "min(651px, 34vw)",
          // lineHeight: 1.17,
        }}
        className="text-[clamp(1rem,1.25vw,24px)] max-w-[min(651px,34vw)] leading-[1.17] max-md:text-[clamp(0.75rem,1.25vw,24px)] max-sm:text-[clamp(0.75rem,1.25vw,20px)] max-md:max-w-[min(651px,60vw)] "
      >
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua.
      </p>
    </div>
  </section>
);

export default Hero;
