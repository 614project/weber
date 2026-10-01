// 플레이그라운드 예제 모음 (tests/site.test.ts 에서 모두 경고 없이 변환되는지 검사합니다)
export const EXAMPLES = [
  {
    id: 'hello',
    title: 'weber 첫걸음',
    code: `// 키의 색이 weber 의 판별 결과입니다.
// 요소 · 속성 · CSS · JS
div.card {
    class welcome
    padding 24px
    border-radius 16px
    background #f4f1ff
    font-family system-ui, sans-serif

    h1: "안녕하세요, weber!"
    p: "key { } 와 key: value 를 쌓으면 웹이 됩니다."
    button {
        "눌러 보세요"
        padding 8px 16px
        onclick {
            this.textContent = '반가워요 👋'
        }
    }
}
`,
  },
  {
    id: 'readme',
    title: 'README 의 첫 예제',
    code: `div {
    class weber
    font-size 1rem
    p: "614project"
    button {
        "click me!"
        onclick {
            alert('hello')
        }
    }
    script {
        console.log("hello world!")
    }
}
`,
  },
  {
    id: 'hover',
    title: '버튼과 :hover',
    code: `// 요소 안의 :hover, @media 는 그 요소에만 적용됩니다.
button.cta {
    "시작하기"
    padding 12px 28px
    border none
    border-radius 999px
    background #6c4cf1
    color white
    font-size 16px
    cursor pointer
    transition transform .15s

    :hover { transform scale(1.06) }
    :active { transform scale(.96) }
    @media (max-width: 480px) { width 100% }
}
`,
  },
  {
    id: 'counter',
    title: '카운터 (이벤트)',
    code: `.counter {
    display flex
    align-items center
    gap 16px
    font-family system-ui, sans-serif
    font-size 28px

    button { "−"; onclick: n.textContent = +n.textContent - 1 }
    output#n: "0"
    button { "+"; onclick: n.textContent = +n.textContent + 1 }
}
`,
  },
  {
    id: 'todo',
    title: '할 일 목록',
    code: `style {
    body { font-family system-ui, sans-serif }
    li {
        padding 10px 14px
        margin-bottom 6px
        border-radius 8px
        background #f2f0fa
        cursor pointer
        &.done { color #aaa; text-decoration line-through }
    }
}

form {
    display flex
    gap 8px
    input#task[placeholder="할 일을 입력하세요"][required] { flex 1 }
    button: "추가"
    onsubmit {
        event.preventDefault()
        const li = document.createElement('li')
        li.textContent = this.task.value
        li.onclick = () => li.classList.toggle('done')
        list.append(li)
        this.reset()
    }
}
ul#list { padding 0; list-style none }
`,
  },
  {
    id: 'style',
    title: '스타일 블록과 애니메이션',
    code: `// style 블록 안에서는 Sass 처럼 중첩할 수 있습니다.
style {
    .dots {
        display flex
        gap 10px
        padding 24px
        span {
            width 16px
            height 16px
            border-radius 50%
            background #6c4cf1
            animation bounce 1s infinite ease-in-out
            &:nth-child(2) { animation-delay .15s }
            &:nth-child(3) { animation-delay .3s }
        }
    }
    @keyframes bounce {
        0%, 100% { transform translateY(0) }
        50% { transform translateY(-14px) }
    }
}
.dots { span; span; span }
`,
  },
  {
    id: 'svg',
    title: 'SVG 그림',
    code: `svg {
    width 240
    height 160
    viewBox "0 0 240 160"
    rect { width 240; height 160; rx 16; fill #1d1b2e }
    circle { cx 90; cy 75; r 42; fill #b69cff }
    circle { cx 150; cy 75; r 42; fill #5ccfe6; opacity .8 }
    text {
        x 120
        y 145
        text-anchor middle
        fill white
        font-size 14
        "weber ♥ svg"
    }
}
`,
  },
  {
    id: 'document',
    title: '문서 한 장 통째로',
    code: `// head 와 body 를 쓰지 않아도 알맞은 곳에 나눠 담습니다.
lang ko
title: "내 첫 페이지"
viewport "width=device-width, initial-scale=1"

font-family system-ui, sans-serif
header {
    padding 32px
    background #1d1b2e
    color white
    h1: "내 첫 페이지"
}
main {
    padding 32px
    p { "head, body, meta charset 은 "; b: "weber 가"; " 채워 줍니다." }
}
`,
  },
];
