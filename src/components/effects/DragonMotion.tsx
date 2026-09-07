import type { CSSProperties } from 'react'
import './DragonMotion.css'

export type DragonMotionState =
  | 'idle'
  | 'listening'
  | 'wish'
  | 'burn'
  | 'complete'

export type DragonAssets = {
  /** 몸통 */
  body?: string
  /** 꼬리 (몸통 뒤에 깔린다) */
  tail?: string
  maneBack?: string
  head?: string
  /** burn 상태에서 head 대신 쓰는 입 벌린 컷 (캔버스가 달라 좌표도 따로 잡는다) */
  headFire?: string
  armLeft?: string
  armRight?: string
  flameFrames?: string[]
  waterFx?: string
  /** public/orb 세트. wish 와 complete 가 나눠 쓴다. */
  orb?: {
    /** wish: 손 안에서 자라는 구슬. 순서대로 겹쳐 쌓인다. */
    frames?: string[]
    /** wish: 확산 링 */
    ring?: string
    /** wish: 바닥 파문 */
    ripple?: string
    /** wish: 반짝임 */
    sparkles?: string
    /** wish: 구슬을 감는 궤적 */
    trails?: string[]
    /** complete: 성광 플래시 */
    flash?: string
    /** complete: 퍼져나가는 오오라 구체 */
    aura?: string
  }
}

type Props = {
  state: DragonMotionState
  assets: DragonAssets
  className?: string
  size?: number | string
  burnText?: string
  ariaLabel?: string
}

type LayerProps = {
  src?: string
  name: string
  className?: string
}

function Layer({ src, name, className = '' }: LayerProps) {
  if (!src) return null
  return (
    <img
      className={`dm-layer dm-${name} ${className}`}
      src={src}
      alt=""
      draggable={false}
    />
  )
}

export function DragonMotion({
  state,
  assets,
  className = '',
  size = 'min(60vw, 280px)',
  burnText,
  ariaLabel = '용왕 캐릭터 애니메이션',
}: Props) {
  const style = { '--dm-size': typeof size === 'number' ? `${size}px` : size } as CSSProperties
  const fireCut = state === 'burn' && Boolean(assets.headFire)

  return (
    <section
      className={`dragon-motion dragon-motion--${state} ${className}`}
      style={style}
      data-state={state}
      aria-label={ariaLabel}
    >
      <div className="dm-aura" />
      <div className="dm-stage">
        <div className="dm-character">
          <Layer src={assets.maneBack} name="mane-back" />
          <Layer src={assets.tail} name="tail" />
          <Layer src={assets.body} name="body" />
          <Layer
            src={fireCut ? assets.headFire : assets.head}
            name="head"
            className={fireCut ? 'dm-head--fire' : ''}
          />
          <Layer src={assets.armLeft} name="arm-left" />
          <Layer src={assets.armRight} name="arm-right" />

          {assets.orb && (
            <div className="dm-orbfx" aria-hidden="true">
              {assets.orb.ripple && <img className="dm-orb-ripple" src={assets.orb.ripple} alt="" draggable={false} />}
              {assets.orb.aura && <img className="dm-orb-aura" src={assets.orb.aura} alt="" draggable={false} />}
              {assets.orb.ring && <img className="dm-orb-ring" src={assets.orb.ring} alt="" draggable={false} />}
              {assets.orb.trails?.map((src, index) => (
                <img
                  key={src}
                  className="dm-orb-trail"
                  style={{ '--dm-tr': index } as CSSProperties}
                  src={src}
                  alt=""
                  draggable={false}
                />
              ))}
              {assets.orb.frames?.map((src, index) => (
                <img
                  key={src}
                  className="dm-orb-core"
                  style={{ '--dm-of': index } as CSSProperties}
                  src={src}
                  alt=""
                  draggable={false}
                />
              ))}
              {assets.orb.flash && <img className="dm-orb-flash" src={assets.orb.flash} alt="" draggable={false} />}
              {assets.orb.sparkles && <img className="dm-orb-sparkles" src={assets.orb.sparkles} alt="" draggable={false} />}
            </div>
          )}

          <div className="dm-flame" aria-hidden="true">
            {assets.flameFrames?.length ? (
              assets.flameFrames.map((src, index) => (
                <img
                  key={src}
                  className="dm-flame-frame"
                  style={{ '--dm-frame': index } as CSSProperties}
                  src={src}
                  alt=""
                  draggable={false}
                />
              ))
            ) : (
              <div className="dm-flame-fallback">
                <i /><i /><i />
              </div>
            )}
          </div>

          {burnText && <p className="dm-burn-text">{burnText}</p>}
          <Layer src={assets.waterFx} name="water-fx" />
          {!assets.waterFx && <div className="dm-ripple dm-ripple--one" />}
          {!assets.waterFx && <div className="dm-ripple dm-ripple--two" />}
        </div>
      </div>
    </section>
  )
}
