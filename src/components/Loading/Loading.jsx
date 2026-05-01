import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import styles from "./Loading.module.css";

const Loading = () => {
  return (
    <div className={styles.loading}>
      <DotLottieReact
        src="https://lottie.host/0afb8ad4-689e-4dd1-847e-b44e2f79f87f/JN7tZ8LjUq.lottie"
        loop
        autoplay
      />
    </div>
  );
};

export default Loading;