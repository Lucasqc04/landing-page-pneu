# Atelier Pneus Signature - Landing Page Premium

Landing page em React + Tailwind CSS com narrativa visual premium para revitalizacao/reforma de pneus.

## Stack

- React (Vite)
- Tailwind CSS
- Componentes reutilizaveis
- Hook dedicado para scrub de video por scroll

## Como rodar

```bash
npm install
npm run dev
```

## Hero com video controlado por scroll

A hero foi implementada com:

- `section` com altura estendida para storytelling
- `sticky` para manter a hero travada na tela
- video centralizado, sem controles, mudo e com `playsInline`
- scrub por scroll (desce avanca, sobe volta)
- continuidade normal da pagina apenas apos o fim do scrub

Arquivo principal:

- `src/components/sections/HeroScrollVideo.jsx`
- `src/hooks/useScrollScrubVideo.js`

Video atual no projeto:

- `public/videos/hero-tire-restoration.mp4`

## Trocar pelo video real

Substitua o arquivo:

`public/videos/hero-tire-restoration.mp4`

ou ajuste a constante `heroVideoPath` em `src/App.jsx`.

## Observacao tecnica obrigatoria para fluidez

Se o vídeo travar durante o scroll, ele deve ser reencodado com FFMPEG para que cada frame seja um keyframe, facilitando o scrubbing suave.

Exemplo:

```bash
ffmpeg -i input.mp4 -c:v libx264 -preset slow -crf 18 -g 1 -keyint_min 1 -sc_threshold 0 -an output-keyframe.mp4
```

## Estrutura

```text
src/
  components/
    sections/
      HeroScrollVideo.jsx
      TransformationSection.jsx
      ProcessSection.jsx
      BenefitsSection.jsx
      FinalCtaSection.jsx
    ui/
      Container.jsx
      SectionHeading.jsx
      SectionLabel.jsx
      Reveal.jsx
  content/
    landingContent.js
  hooks/
    useScrollScrubVideo.js
```
# landing-page-pneu
