import React, { CSSProperties, PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react'; 
import { useForceUpdate, joinClassNames as join, isMobile, defineOnGlobal, range } from '../../utils';
import styles from './renderer.scss';
import { PuzzleManager, Vec2 } from '../../puzzle-manager';

const TAP_EVENT = isMobile ? "onTouchStart" : "onMouseDown";
const equals = (p1: Vec2, p2: Vec2) => p1[0] === p2[0] && p1[1] === p2[1];

export function FifteenPuzzleRenderer() {
  const keyMap = useRef({
    4:[0,0], 5:[1,0], 6:[2,0], 7:[3,0],
    r:[0,1], t:[1,1], y:[2,1], u:[3,1],
    f:[0,2], g:[1,2], h:[2,2], j:[3,2],
    v:[0,3], b:[1,3], n:[2,3], m:[3,3],
  } as { [key: string]: Vec2 });

  const forceUpdate = useForceUpdate();
  const [ size, setSize ] = useState<Vec2>([4, 4]);
  const puzzleManager = useMemo(() => new PuzzleManager().new(...size).on("update", forceUpdate), []);
  const { columns, rows, pointUtil } = puzzleManager.current;
  const { isSolved } = puzzleManager;

  const tap = useCallback(async (coord: Vec2) =>
    puzzleManager.isSolved && equals(coord, size.map(c => c - 1) as Vec2)
    ? puzzleManager.new(...size)
    : puzzleManager.tap(coord), [puzzleManager, size]);
  const onKeyDown = useCallback((key: string) => {
    if (key == " ") puzzleManager.new(...size);
    const point = keyMap.current[key.toLowerCase()];
    if (Array.isArray(point)) tap(point);
  }, [tap, size]);
  const onKeyDownRef = useRef(onKeyDown);

  useEffect(() => {
    onKeyDownRef.current = onKeyDown;
  }, [onKeyDown]);
  useEffect(() => {
    document.addEventListener("keydown", ({ key }: KeyboardEvent) => onKeyDownRef.current(key));
  }, []);

  defineOnGlobal({ puzzleManager, forceUpdate, setSize, keyMap })

  return (
    <div style={{ "--columns": columns, "--rows": rows } as CSSProperties}
         className={styles.fifteenPuzzleRenderer}>
      {
        puzzleManager.getNumbers().map(({ coord, number, isCorrect }) => (
          <Piece hidden={number == 0 && !isSolved} correct={isCorrect} coord={coord} key={number}>
            <div className={styles.content}>
              { number == 0 ? "R" : number }
            </div>
          </Piece>
        ))
      }
      <div className={styles.tapListeners} aria-hidden>
        {
          range(columns * rows).map(index => (
            <div {...{ [TAP_EVENT]: () => tap(pointUtil.convertIndexToPoint(index))}}
                  className={styles.listener} key={index} />
          ))
        }
      </div>
    </div>
  );
}

interface PieceProps {
  correct: boolean;
  hidden: boolean;
  coord: Vec2;
}
function Piece(props: PropsWithChildren<PieceProps>) {
  const [x, y] = props.coord;
  return (
    <div style={{ "--x": x, "--y": y } as CSSProperties}
         className={join(styles.piece,
                         props.correct && styles.correct,
                         props.hidden && styles.hidden)}>
      { props.children }
    </div>
  );
}
