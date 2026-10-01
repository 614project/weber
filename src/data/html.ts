/**
 * HTML / SVG / MathML 에 대한 지식 베이스.
 * 판별기(classify)와 출력기(printer)가 이 목록을 기준으로 동작합니다.
 */

const words = (text: string): ReadonlySet<string> => new Set(text.trim().split(/\s+/));

/** 현재 HTML 표준 요소 (폐기된 요소 제외) */
export const HTML_ELEMENTS = words(`
  a abbr address area article aside audio b base bdi bdo blockquote body br button canvas
  caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed
  fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe
  img input ins kbd label legend li link main map mark menu meta meter nav noscript object ol
  optgroup option output p picture pre progress q rp rt ruby s samp script search section
  select selectedcontent slot small source span strong style sub summary sup table tbody td
  template textarea tfoot th thead time title tr track u ul var video wbr svg math
`);

/** 닫는 태그가 없는 요소 */
export const VOID_ELEMENTS = words(`
  area base br col embed hr img input link meta source track wbr
`);

/** head 안에 들어가는 메타데이터 요소 */
export const HEAD_ELEMENTS = words(`title meta link base style script noscript template`);

/** 최상위에 쓰면 head 로 옮겨지는 요소 */
export const HEAD_ONLY_ELEMENTS = words(`title meta link base style`);

/**
 * 앞뒤 공백이 렌더링에 영향을 주지 않는 요소.
 * 출력기는 이 요소들 주위에서만 줄바꿈과 들여쓰기를 넣습니다.
 */
export const BLOCK_ELEMENTS = words(`
  address article aside base blockquote body br caption col colgroup datalist dd details
  dialog div dl dt fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup
  hr html legend li link main menu meta nav noscript ol optgroup option p pre script search
  section source style summary table tbody td template tfoot th thead title tr track ul
`);

/** 내용을 그대로 보존해야 하는 요소 (줄바꿈/들여쓰기를 넣지 않음) */
export const PREFORMATTED_ELEMENTS = words(`pre textarea`);

/** 모든 요소에 쓸 수 있는 전역 속성 (마지막 줄은 Open Graph 등에 쓰이는 RDFa 속성) */
export const GLOBAL_ATTRIBUTES = words(`
  accesskey autocapitalize autocorrect autofocus class contenteditable dir draggable
  enterkeyhint exportparts hidden id inert inputmode is itemid itemprop itemref itemscope
  itemtype lang nonce part popover role slot spellcheck style tabindex title translate
  writingsuggestions
  about prefix property resource typeof vocab
`);

/** 요소별 전용 속성 */
export const ELEMENT_ATTRIBUTES: ReadonlyMap<string, ReadonlySet<string>> = new Map(
  Object.entries({
    a: 'href target download ping rel hreflang type referrerpolicy',
    area: 'alt coords shape href target download ping rel referrerpolicy',
    audio: 'src crossorigin preload autoplay loop muted controls',
    base: 'href target',
    blockquote: 'cite',
    button:
      'command commandfor disabled form formaction formenctype formmethod formnovalidate ' +
      'formtarget name popovertarget popovertargetaction type value',
    canvas: 'width height',
    col: 'span',
    colgroup: 'span',
    data: 'value',
    del: 'cite datetime',
    details: 'open name',
    dialog: 'open closedby',
    embed: 'src type width height',
    fieldset: 'disabled form name',
    form: 'accept-charset action autocomplete enctype method name novalidate target rel',
    iframe: 'src srcdoc name sandbox allow allowfullscreen width height referrerpolicy loading',
    img:
      'alt src srcset sizes crossorigin usemap ismap width height referrerpolicy decoding ' +
      'loading fetchpriority',
    input:
      'accept alpha alt autocomplete checked colorspace dirname disabled form formaction ' +
      'formenctype formmethod formnovalidate formtarget height list max maxlength min ' +
      'minlength multiple name pattern placeholder popovertarget popovertargetaction readonly ' +
      'required size src step type value width',
    ins: 'cite datetime',
    label: 'for',
    li: 'value',
    link:
      'href crossorigin rel media integrity hreflang type referrerpolicy sizes imagesrcset ' +
      'imagesizes as blocking color disabled fetchpriority',
    map: 'name',
    meta: 'name http-equiv content charset media',
    meter: 'value min max low high optimum',
    object: 'data type name form width height',
    ol: 'reversed start type',
    optgroup: 'disabled label',
    option: 'disabled label selected value',
    output: 'for form name',
    progress: 'value max',
    q: 'cite',
    script:
      'src type nomodule async defer crossorigin integrity referrerpolicy blocking fetchpriority charset',
    select: 'autocomplete disabled form multiple name required size',
    slot: 'name',
    source: 'type media src srcset sizes width height',
    style: 'media blocking',
    table: 'border',
    td: 'colspan rowspan headers',
    th: 'colspan rowspan headers scope abbr',
    template:
      'shadowrootmode shadowrootdelegatesfocus shadowrootclonable shadowrootserializable',
    textarea:
      'autocomplete cols dirname disabled form maxlength minlength name placeholder readonly ' +
      'required rows wrap',
    time: 'datetime',
    track: 'default kind label src srclang',
    video:
      'src crossorigin poster preload autoplay playsinline loop muted controls width height',
    html: 'xmlns',
    svg: 'xmlns',
    math: 'xmlns display',
  }).map(([tag, attrs]) => [tag, words(attrs)]),
);

/** 어떤 요소에서든 쓰이는 모든 HTML 속성 이름 */
export const ALL_HTML_ATTRIBUTES: ReadonlySet<string> = new Set([
  ...GLOBAL_ATTRIBUTES,
  ...[...ELEMENT_ATTRIBUTES.values()].flatMap((set) => [...set]),
]);

/** 값이 없거나 true 이면 이름만, false 이면 생략되는 불리언 속성 */
export const BOOLEAN_ATTRIBUTES = words(`
  allowfullscreen alpha async autofocus autoplay checked controls default defer disabled
  formnovalidate inert ismap itemscope loop multiple muted nomodule novalidate open playsinline
  readonly required reversed selected shadowrootclonable shadowrootdelegatesfocus
  shadowrootserializable hidden
`);

/** input 요소의 type 값 (`input: email` 처럼 쓸 수 있음) */
export const INPUT_TYPES = words(`
  button checkbox color date datetime-local email file hidden image month number password
  radio range reset search submit tel text time url week
`);

/** head 에서 `이름 값` 으로 쓰면 <meta name content> 가 되는 이름 */
export const META_NAMES = words(`
  viewport description keywords author generator theme-color color-scheme robots referrer
  application-name creator publisher googlebot format-detection
`);

/** SVG 요소 (대소문자 구분) */
export const SVG_ELEMENTS = words(`
  svg g defs symbol use image switch foreignObject desc title metadata path rect circle
  ellipse line polyline polygon text tspan textPath linearGradient radialGradient stop pattern
  clipPath mask marker filter feBlend feColorMatrix feComponentTransfer feComposite
  feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feDropShadow feFlood
  feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology
  feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence a style script
  view animate animateMotion animateTransform set mpath
`);

/** SVG 속성 (프레젠테이션 속성 포함, 대소문자 구분) */
export const SVG_ATTRIBUTES = words(`
  viewBox preserveAspectRatio xmlns version width height x y x1 y1 x2 y2 cx cy r rx ry fx fy fr
  d points pathLength transform fill fill-opacity fill-rule stroke stroke-width
  stroke-linecap stroke-linejoin stroke-dasharray stroke-dashoffset stroke-miterlimit
  stroke-opacity opacity href gradientUnits gradientTransform spreadMethod offset stop-color
  stop-opacity patternUnits patternContentUnits patternTransform clip-path clipPathUnits
  clip-rule mask maskUnits maskContentUnits marker-start marker-mid marker-end markerWidth
  markerHeight markerUnits refX refY orient filter filterUnits primitiveUnits in in2 result
  stdDeviation dx dy rotate textLength lengthAdjust text-anchor dominant-baseline
  alignment-baseline baseline-shift font-family font-size font-weight font-style
  font-variant letter-spacing word-spacing text-decoration visibility display overflow color
  cursor pointer-events vector-effect paint-order shape-rendering text-rendering
  image-rendering color-interpolation color-interpolation-filters mode operator k1 k2 k3 k4
  values type attributeName begin dur end repeatCount repeatDur from to by keyTimes
  keySplines calcMode additive accumulate restart path keyPoints startOffset method spacing
  side flood-color flood-opacity lighting-color baseFrequency numOctaves seed stitchTiles scale
  xChannelSelector yChannelSelector kernelMatrix kernelUnitLength order surfaceScale
  specularConstant specularExponent diffuseConstant azimuth elevation z pointsAtX pointsAtY
  pointsAtZ limitingConeAngle tableValues slope intercept amplitude exponent radius edgeMode
  targetX targetY divisor bias preserveAlpha crossorigin systemLanguage requiredExtensions
  focusable target download rel
`);

/** SVG 에서 공백이 의미를 갖는 (텍스트를 담는) 요소 */
export const SVG_TEXT_ELEMENTS = words(`text tspan textPath title desc a style script`);

/** MathML 요소 */
export const MATH_ELEMENTS = words(`
  math mi mn mo ms mtext mspace mrow mfrac msqrt mroot mstyle merror mpadded mphantom msub
  msup msubsup munder mover munderover mmultiscripts mprescripts mtable mtr mtd maction
  semantics annotation annotation-xml
`);

/** MathML 속성 */
export const MATH_ATTRIBUTES = words(`
  display mathvariant displaystyle scriptlevel mathcolor mathbackground mathsize
  linethickness stretchy fence separator lspace rspace accent accentunder columnalign
  rowalign columnspan rowspan form largeop movablelimits symmetric minsize maxsize depth
  height width voffset encoding definitionURL
`);

/** MathML 에서 텍스트를 담는 토큰 요소 */
export const MATH_TOKEN_ELEMENTS = words(`mi mn mo ms mtext annotation`);

/** 값을 주면 내용 대신 이 속성으로 들어가는 요소 (`img: cat.png` → src) */
export const PRIMARY_ATTRIBUTES: ReadonlyMap<string, string> = new Map([
  ['img', 'src'],
  ['iframe', 'src'],
  ['embed', 'src'],
  ['source', 'src'],
  ['track', 'src'],
  ['link', 'href'],
  ['base', 'href'],
  ['object', 'data'],
]);

/** 값이 URL 처럼 보일 때만 src 로 들어가는 요소 (아니면 대체 텍스트) */
export const MEDIA_ELEMENTS = words(`audio video`);
