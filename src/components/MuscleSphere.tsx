import { motion } from 'framer-motion';
import type { TrainingPhase } from '../types/training';
import Aura from './muscle-sphere/Aura';
import RippleLayers from './muscle-sphere/RippleLayers';
import Fluid from './muscle-sphere/Fluid';
import Fascia from './muscle-sphere/Fascia';
import Fibers from './muscle-sphere/Fibers';
import Core from './muscle-sphere/Core';
import Particles from './muscle-sphere/Particles';
import Highlight from './muscle-sphere/Highlight';
import ShadowLayer from './muscle-sphere/ShadowLayer';

interface Props {
  phase: TrainingPhase;
  isRunning: boolean;
  isPaused: boolean;
}

const SPRING = { type: 'spring' as const, damping: 20, stiffness: 60 };
const RELEASE_SPRING = { type: 'spring' as const, damping: 13, stiffness: 45, mass: 1.1 };

export default function MuscleSphere({ phase, isRunning, isPaused }: Props) {
  const isActive = isRunning && !isPaused;
  const isContracting = (phase === 'contract' || phase === 'hold') && isActive;
  const isReleasing = phase === 'relax' && isActive;

  /* 非对称压缩 —— 模拟盆底肌向上提 + 向内收紧 */
  const scaleX = isContracting ? 0.72 : 1;
  const scaleY = isContracting ? 0.66 : 1;
  const y = isContracting ? -18 : 0;
  const rotate = isContracting ? 1.2 : 0;

  const trans = isReleasing ? RELEASE_SPRING : SPRING;

  return (
    <motion.div
      animate={{ scaleX, scaleY, y, rotate }}
      transition={trans}
      className="relative w-72 h-72"
    >
      {/* 层叠 SVG 图层 —— 自底向上 */}
      <Aura phase={phase} />
      <ShadowLayer phase={phase} />
      <RippleLayers phase={phase} />
      <Fluid phase={phase} />
      <Fascia phase={phase} />
      <Fibers phase={phase} />
      <Core phase={phase} />
      <Particles phase={phase} />
      <Highlight phase={phase} />

      {/* 玻璃质感表面反光 */}
      <div className="absolute inset-[18%] rounded-full bg-gradient-to-br from-white/25 via-white/6 to-transparent pointer-events-none" />
    </motion.div>
  );
}
