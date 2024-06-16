# weber
(아직 미완성.)  

HTML 파일로 컴파일되는, 간결한 문법의 컴파일 언어입니다.
```
head {
    title: "weber"
}
body {
    h1: "hello world!"
}
```
## 목적
HTML 보다 더 간결한 문법으로 웹사이트를 구성하기 위한 언어입니다.
## 특징
HTML 태그에서 속성, 스타일, 자바스크립트, 그리고 콘텐츠의 구분이 없습니다.  
예시로, HTML에서는 이렇게 작성하는 코드를
```html
<div class="weber" style="font-size: 1rem">
    <p>614project</p><br>
    <button onclick="alert('hello')">click me!</button>
    <script>
        console.log("hello world!");
    </script>
</div>
```
weber에서는 다음과 같이 작성합니다.
```
div {
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
```
weber 컴파일러가 자동으로 어떤 요소인지 판단하여 변환해주므로 이와 같은 기능이 가능해집니다.
