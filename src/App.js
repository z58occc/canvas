import { useEffect, useRef, useState } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

function App() {
  const [show, setShow] = useState(true);//決定折疊狀態
  const [underShow, setUnderShow] = useState(true);//決定折疊狀態
  const arrowRef = useRef(null);
  const underArrowRef = useRef(null);
  const underRef = useRef(null);
  const contentRef = useRef(null);
  const canvasRef = useRef(null);
  const backRef = useRef(null);
  const justBrushRef = useRef(null);
  const coordinateRef = useRef([0, 0]); // 用 ref 來儲存最新的座標
  const aboveRef = useRef(null);
  const historyStack = useRef([]);//儲存歷史資料
  const redoStack = useRef([]);//儲存按下上一步之後從歷史資料pop出來的資料
  const [ctx, setCtx] = useState(null);
  const doneRef = useRef(false);//畫完一筆 就儲存資料



  const hide = () => {//點擊後切換折疊狀態
    setShow(pre => !pre)
  }
  const underHide = () => {//點擊後切換折疊狀態
    setUnderShow(pre => !pre);
  }

  useEffect(() => {//上方折疊
    if (show) {//根據折疊狀態切換css
      contentRef.current.style.height = '';//原本的高度
      arrowRef.current.style.transform = 'rotate(225deg)';//箭頭往上
      arrowRef.current.style.marginTop = '5px';
      aboveRef.current.style.display = 'flex';
    } else {
      contentRef.current.style.height = '0px';//改為0px
      arrowRef.current.style.transform = 'rotate(45deg)';//箭頭往下
      aboveRef.current.style.display = 'none';
    }

  }, [show])
  useEffect(() => {//下方折疊
    if (underShow) {//根據折疊狀態切換css
      underArrowRef.current.style.transform = 'rotate(225deg)';//箭頭往下
      underRef.current.style.display = '';
      justBrushRef.current.style.display = 'none';



    } else {
      underRef.current.style.display = 'none';
      justBrushRef.current.style.display = 'flex';


    }

  }, [underShow])




  useEffect(() => {
    if (canvasRef.current) {
      // 在畫布初始化時只設定一次 ctx
      const context = canvasRef.current.getContext("2d");
      setCtx(context);
      saveState();//把初始狀態存入歷史資料
    }
  }, [ctx]);

  function draw(prevX, prevY, currentX, currentY) {
    if (ctx) {
      ctx.beginPath();//開始
      ctx.moveTo(prevX, prevY);//移動參考點
      ctx.lineTo(currentX, currentY);//從上個點到這個點畫線
      ctx.stroke();//結束
    }
  }


  const handleMouseMove = (e) => {
    const [prevX, prevY] = coordinateRef.current;//上個座標
    const currentX = e.offsetX;//滑鼠目前的座標
    const currentY = e.offsetY;

    if (prevX !== undefined && prevY !== undefined) {
      draw(prevX, prevY, currentX, currentY); // 繪製從前一點到新座標的線
    }
    coordinateRef.current = [currentX, currentY];//把新的點寫入參考點
  };
  const removeMouseMove = () => {//當滑鼠離開 或滑鼠鬆開時觸發 
    canvasRef.current.removeEventListener('mousemove', handleMouseMove);//移除事件監聽器（滑鼠移動）
    if (doneRef.current) {//如果已完成 存檔 把存檔狀態改為false
      saveState();
      doneRef.current = false;
    }
  }
  const handleMouseDown = (e) => {//滑鼠按下 觸發
    canvasRef.current.addEventListener("mousemove", handleMouseMove);//加上事件監聽器
    coordinateRef.current = [e.offsetX, e.offsetY];//將滑鼠目前座標寫入參考點
    doneRef.current = true;//將已完成改為true
  };

  // 設定 canvas 初始大小
  const resizeCanvas = () => {
    if (canvasRef.current) {
      canvasRef.current.width = window.innerWidth;//canvas寬度為視窗寬度
    }
  };

  // 監聽 resize 事件
  window.addEventListener("resize", resizeCanvas);//監聽寬度變化
  useEffect(() => {//初始化canvas大小
    canvasRef.current.width = window.innerWidth;
    canvasRef.current.height = window.innerHeight;
  }, [])


  const save = () => {//存檔
    const dataURL = canvasRef.current.toDataURL("image/png");//把他圖轉文
    const img = document.createElement('a');//生成a元素
    img.href = dataURL;//a元素href=生出來的圖
    img.download = '';//a元素加上download屬性
    img.click();//點一下a元素
  }
  const clear = () => {//清空
    if (ctx) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      saveState();//清空後 在歷史資料存檔
    }
  }
  const undo = () => {//上一步
    if (historyStack.current.length > 1) {
      redoStack.current.push(historyStack.current.pop());//將歷史資料最後一筆踢出到 下一步資料
      const prev = historyStack.current[historyStack.current.length - 1];//這是上一步的圖
      const img = new Image();//new一個image
      img.src = prev;//把上一步的圖賦值到img
      img.onload = () => {//.onload img加載完成後再執行
        clear();
        ctx.drawImage(img, 0, 0);//清空後把上一步的圖畫出來
      }
    }
  }
  const redo = () => {//下一步
    if (redoStack.current.length > 0) {
      historyStack.current.push(redoStack.current.pop());//把最新的圖push回歷史資料
      const redo = historyStack.current[historyStack.current.length - 1];
      //歷史資料最新的圖（現在的圖的下一步）
      const img = new Image();
      img.src = redo;
      img.onload = () => {
        clear();
        ctx.drawImage(img, 0, 0);
      }
    }

  }
  const saveState = () => {//自動存檔
    if (canvasRef.current.toDataURL() !== historyStack.current[historyStack.current.length - 1]) {//目前的圖跟暫存資料中最新的圖不一樣就存檔
      if (ctx) {
        historyStack.current.push(canvasRef.current.toDataURL());//存入歷史資料
        redoStack.current = [];//清空下一步資料（新的開始）
      }
    }
  }




  return (
    <div className="App ">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" />
      <link href="https://fonts.googleapis.com/css2?family=Chocolate+Classical+Sans&family=Noto+Sans+TC:wght@100..900&family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Roboto+Condensed:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet"></link>
      <div className="back   d-grid"
        ref={backRef}
      >
        <div className="content d-flex
        justify-content-center
        align-items-center
        "
          ref={contentRef}
        >
          <div className='above '
            ref={aboveRef}
          >
            <div className='save-box d-flex
          justify-content-center
          align-items-center
          '
              onClick={() => save()}
            >
              <i className="bi bi-floppy-fill"
                style={{
                  fontSize: '36px'
                }}
              ></i>
              <div className='save'>
                save
              </div>
            </div>
            <div className=' d-flex
          justify-content-center
          align-items-center
          '
              onClick={() => clear()}
            >
              <i className="bi bi-crop"
                style={{
                  fontSize: '36px'
                }}
              ></i>
              <div className='clear-all'
                style={{
                  width: '104px'
                }}
              >
                CLEAR ALL
              </div>
            </div>
            <div className='save-box d-flex
          justify-content-center
          align-items-center
          '
              onClick={() => undo()}
            >
              <i className="bi bi-arrow-90deg-left"
                style={{
                  fontSize: '36px'
                }}
              ></i>
              <div className='save'>
                UNDO
              </div>
            </div>
            <div className='save-box d-flex
          justify-content-center
          align-items-center
          '
              onClick={() => redo()}
            >
              <i className="bi bi-arrow-90deg-right"
                style={{
                  fontSize: '36px'
                }}
              ></i>
              <div className='save'>
                REDO
              </div>
            </div>

          </div>

        </div>
        <div className='
        d-flex
        justify-content-center
        align-items-center
        '>

          <div className='up
            d-flex
            justify-content-center
            align-items-center
          '
            onClick={() => hide()}
          >
            <div className='box
            d-flex
            justify-content-center
            align-items-center
            '
            >
              <div className='clollaspe-arrow'
                ref={arrowRef}
              >
              </div>
            </div>
          </div>
        </div>
        <canvas id="canvas"
          onMouseDown={(e) => handleMouseDown(e)}
          onMouseUp={() => removeMouseMove()}
          onMouseLeave={() => removeMouseMove()}
          ref={canvasRef}

        ></canvas>
        <div className='
        justify-content-center
        align-items-center
        '
        ref={justBrushRef}
        style={{
          marginBottom:'40px'
        }}
        >

            <div className='brush-icon
            d-flex
            justify-content-center
            align-items-center
          '
          onClick={()=>underHide()}
          style={{
            cursor:'pointer'
          }}
            >
              <div className='box
            d-flex
            justify-content-center
            align-items-center
            '

              >
                <i className="bi bi-brush-fill"
                  style={{
                    fontSize: '21px',
                  }}
                ></i>
              </div>
            </div>
          </div>
        <div className='under'
          ref={underRef}>
          
          <div className='
        d-flex
        justify-content-center
        align-items-center
        '>

            <div className='up
            d-flex
            justify-content-center
            align-items-center
          '
              style={{
                transform: 'rotate(180deg)'
              }}
              onClick={() => underHide()}

            >
              <div className='box
            d-flex
            justify-content-center
            align-items-center
            '

              >
                <div className='clollaspe-arrow'
                  ref={underArrowRef}
                >
                </div>
              </div>
            </div>
          </div>
          <div className=' 
        d-flex
        justify-content-center
        align-items-center
        '
            style={{
              marginBottom: '40px'
            }}
          >

            <div className='brush
          d-flex
        justify-content-center
        align-items-center
          '>
              <i className="bi bi-brush-fill"
                style={{
                  fontSize: '42px',
                  marginRight: '43px'
                }}
              ></i>
              <div className='size 
            d-flex
        justify-content-center
        align-items-center'>
                size:
                <div className='size-num
              d-flex
        justify-content-center
        align-items-center
              '
                  style={{
                    marginLeft: '16px',
                    marginRight: '8px'
                  }}
                >
                  10
                </div>
                { }
                px
              </div>
              <div className='color
            d-flex
        justify-content-center
        align-items-center
            '>
                <div style={{
                  marginRight: '16px'
                }}>
                  color:
                </div>
                <div className='circle'
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '2px solid #000000'

                  }}
                ></div>
                <div className='circle'></div>
                <div className='circle
                d-flex
        justify-content-center
        align-items-center
                '
                  style={{
                    backgroundColor: '#9BFFCD'
                  }}

                >
                  <i className="bi bi-check2"
                    style={{
                      fontSize: '24px'
                    }}
                  ></i>
                </div>
                <div className='circle'
                  style={{
                    backgroundColor: '#00CC99'
                  }}
                ></div>
                <div className='circle'
                  style={{
                    backgroundColor: '#01936F'
                  }}
                ></div>


              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

export default App;
