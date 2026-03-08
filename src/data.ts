export interface Song {
  id: string;
  title: string;
  category: 'Adoración' | 'Alabanza';
  author: string;
  lyrics: string;
  lyricsStartAt?: number; // seconds before singing actually begins (intro offset)
  scores: {
    guitar: string;
    piano: string;
    bass: string;
    drums: string;
  };
  audioUrl: string;
}

export const songs: Song[] = [
  {
    id: '1',
    title: 'Cuan Grande es Él',
    category: 'Adoración',
    author: 'Carl Boberg',
    lyrics: `Verso 1:
    Señor, mi Dios, al contemplar los cielos,
    El firmamento y las estrellas mil.
    Al oír Tu voz en los potentes truenos
    Y ver brillar al sol en su cenit.

    Coro:
    Mi corazón entona la canción.
    ¡Cuán grande es Él! ¡Cuán grande es Él!
    Mi corazón entona la canción.
    ¡Cuán grande es Él! ¡Cuán grande es Él!

    Verso 2:
    Al recorrer los montes y los valles
    Y ver las bellas flores al pasar.
    Al escuchar el canto de las aves
    Y el murmurar del claro manantial.

    Verso 3:
    Cuando recuerdo del amor divino,
    Que desde el cielo al Salvador envió.
    Aquel Jesús que por salvarme vino,
    Y en una cruz sufrió y por mí murió.

    Verso 4:
    Cuando el Señor me llame a su presencia,
    Al dulce hogar, al cielo de esplendor.
    Le adoraré, cantando la grandeza
    De su poder y su infinito amor.`,
    scores: {
      guitar: 'https://www.cifraclub.com.br/en-espiritu-y-en-verdad/cuan-grande-es-dios/',
      piano: 'https://www.cifraclub.com.br/en-espiritu-y-en-verdad/cuan-grande-es-dios/teclado.html',
      bass: 'https://www.cifraclub.com.br/en-espiritu-y-en-verdad/cuan-grande-es-dios/baixo.html',
      drums: 'https://www.songsterr.com/a/wsa/en-espiritu-y-en-verdad-cuan-grande-es-dios-drum-tab-s436034'
    },
    audioUrl: '/audio/1.mp3',
    lyricsStartAt: 18
  },
  {
    id: '2',
    title: 'Gracias',
    category: 'Adoración',
    author: 'Marcos Witt',
    lyrics: `Verso 1:
    Me has tomado en tus brazos y me has dado salvación.
    De tu amor has derramado en mi corazón.
    No sabré agradecerte lo que has hecho por mí,
    Sólo puedo darte ahora mi canción.

    Coro:
    Gracias, gracias Señor, gracias mi Señor Jesús.
    Gracias, muchas gracias Señor, gracias mi Señor Jesús.

    Verso 2:
    En la cruz diste tu vida, entregaste todo allí,
    Vida eterna regalaste al morir.
    Por tu sangre tengo entrada ante el trono celestial,
    Puedo entrar confiadamente ante ti.`,
    scores: {
      guitar: 'https://www.cifraclub.com.br/marcos-witt/gracias/',
      piano: 'https://www.cifraclub.com.br/marcos-witt/gracias/teclado.html',
      bass: 'https://www.cifraclub.com.br/marcos-witt/gracias/baixo.html',
      drums: 'https://www.songsterr.com/a/wsa/marcos-witt-gracias-drum-tab-s422480'
    },
    audioUrl: '/audio/2.mp3',
    lyricsStartAt: 12
  },
  {
    id: '3',
    title: 'Hossana',
    category: 'Alabanza',
    author: 'Marco Barrientos',
    lyrics: `Verso 1:
    Levantamos un clamor por sanidad y redención,
    Muéstranos lo que Tú ves, los secretos de Tu corazón.
    Un pueblo unido pide hoy Tu libertad y salvación,
    Ármanos con Tu valor, lo que deseamos es revolución.

    Pre-Coro:
    Que el cielo se parta en dos, inúndanos.
    En el desierto broten ríos, vida sopla hoy.

    Coro:
    Hosanna al Rey de salvación,
    Hosanna al Dios Altísimo.
    Hosanna, Jesucristo, Jesucristo es Rey.

    Puente:
    Hosanna, hosanna, hosanna al Rey.
    Hosanna, hosanna, hosanna al Rey.`,
    scores: {
      guitar: 'https://www.cifraclub.com.br/marco-barrientos/hosanna/',
      piano: 'https://www.cifraclub.com.br/marco-barrientos/hosanna/teclado.html',
      bass: 'https://www.cifraclub.com.br/marco-barrientos/hosanna/baixo.html',
      drums: 'https://www.songsterr.com/a/wsa/marco-barrientos-hosanna-drum-tab-s443422'
    },
    audioUrl: '/audio/3.mp3',
    lyricsStartAt: 22
  },
  {
    id: '4',
    title: 'Al Que Está En El Trono',
    category: 'Alabanza',
    author: 'Marcos Brunet',
    lyrics: `Verso 1:
    Quiero conocerte cada día más a Ti,
    Entrar en Tu presencia y adorar.
    Revélanos Tu gloria, deseamos ir mucho más en Ti,
    Queremos Tu presencia, Jesús.

    Coro:
    Al que está sentado en el trono,
    Al que vive para siempre y siempre.
    Sea la gloria, sea la honra y el poder,
    Sea la gloria, sea la honra y el poder.

    Puente:
    Tú eres Santo, Santo, Santo, Santo, Santo eres Tú.
    Tú eres Santo, Santo, Santo, Santo, Santo eres Tú.`,
    scores: {
      guitar: 'https://www.cifraclub.com.br/marcos-brunet/al-que-esta-sentado-en-el-trono/',
      piano: 'https://www.cifraclub.com.br/marcos-brunet/al-que-esta-sentado-en-el-trono/teclado.html',
      bass: 'https://www.cifraclub.com.br/marcos-brunet/al-que-esta-sentado-en-el-trono/baixo.html',
      drums: 'https://www.songsterr.com/a/wsa/marcos-brunet-al-que-esta-sentado-en-el-trono-drum-tab-s443423'
    },
    audioUrl: '/audio/4.mp3'
  },
  {
    id: '5',
    title: 'Way Maker',
    category: 'Adoración',
    author: 'Sinach',
    lyrics: `Verso 1:
    Aquí estás, te vemos mover, Te adoraré, te adoraré.
    Aquí estás, obrando en mí, Te adoraré, te adoraré.

    Coro:
    Milagroso, abres camino, cumples promesas, luz en tinieblas,
    Mi Dios, así eres Tú.
    Milagroso, abres camino, cumples promesas, luz en tinieblas,
    Mi Dios, así eres Tú.

    Verso 2:
    Aquí estás, tocando mi corazón, Te adoraré, te adoraré.
    Aquí estás, sanando mi corazón, Te adoraré, te adoraré.

    Puente:
    Aunque no pueda ver, estás obrando.
    Aunque no pueda ver, estás obrando.
    Siempre estás, siempre estás obrando.
    Siempre estás, always estás obrando.`,
    scores: {
      guitar: 'https://www.cifraclub.com.br/sinach/way-maker/',
      piano: 'https://www.cifraclub.com.br/sinach/way-maker/teclado.html',
      bass: 'https://www.cifraclub.com.br/sinach/way-maker/baixo.html',
      drums: 'https://www.songsterr.com/a/wsa/leeland-way-maker-live-drum-tab-s460627'
    },
    audioUrl: '/audio/5.mp3'
  },
  {
    id: '6',
    title: 'La Bondad de Dios',
    category: 'Adoración',
    author: 'Bethel Music',
    lyrics: `Verso 1:
    Te amo Dios, Tu amor no me ha fallado,
    En Tus manos, estoy desde el despertar.
    Hasta el anochecer, yo cantaré de la bondad de Dios.

    Coro:
    Toda mi vida has sido fiel,
    Toda mi vida has sido bueno.
    Con cada aliento que me queda,
    Yo cantaré de la bondad de Dios.

    Verso 2:
    Me encanta Tu voz, me has guiado por el fuego,
    En la noche oscura, estás cerca como nadie más.
    Te conozco como Padre, te conozco como amigo,
    He vivido en la bondad de Dios.

    Puente:
    Tu bondad me sigue, me sigue a donde voy.
    Tu bondad me sigue, me sigue a donde voy.
    Mi vida te entrego, todo lo que soy.
    Tu bondad me sigue, me sigue a donde voy.`,
    scores: {
      guitar: 'https://www.cifraclub.com.br/bethel-music/goodness-of-god/',
      piano: 'https://www.cifraclub.com.br/bethel-music/goodness-of-god/teclado.html',
      bass: 'https://www.cifraclub.com.br/bethel-music/goodness-of-god/baixo.html',
      drums: 'https://www.songsterr.com/a/wsa/bethel-music-goodness-of-god-drum-tab-s467890'
    },
    audioUrl: '/audio/6.mp3'
  },
  {
    id: '7',
    title: 'Rey de Reyes',
    category: 'Alabanza',
    author: 'Marco Barrientos',
    lyrics: `Verso 1:
    Rey de Reyes, Te adoramos, Tu grandeza proclamamos.
    Rey de Reyes, soberano, Tu victoria celebramos.

    Pre-Coro:
    Eres Jesús el que dio vida a nuestro corazón,
    Eres Jesús digno de recibir toda la adoración.

    Coro:
    Rey de Reyes Te exaltamos, poderoso en majestad,
    Eres el camino y la verdad.

    Verso 2:
    Rey de Reyes, Te adoramos, Tu grandeza proclamamos.
    Rey de Reyes, soberano, Tu victoria celebramos.`,
    scores: {
      guitar: 'https://www.cifraclub.com.br/marco-barrientos/rey-de-reyes/',
      piano: 'https://www.cifraclub.com.br/marco-barrientos/rey-de-reyes/teclado.html',
      bass: 'https://www.cifraclub.com.br/marco-barrientos/rey-de-reyes/baixo.html',
      drums: 'https://www.songsterr.com/a/wsa/marco-barrientos-rey-de-reyes-drum-tab-s433722'
    },
    audioUrl: '/audio/7.mp3'
  },
  {
    id: '8',
    title: 'Grande y Fuerte',
    category: 'Alabanza',
    author: 'Miel San Marcos',
    lyrics: `Verso 1:
    Grande y fuerte es nuestro Dios,
    Grande y fuerte es nuestro Dios,
    Grande y fuerte es nuestro Dios,
    Grande y fuerte es nuestro Dios.

    Coro:
    Vestido en majestad, coronado con poder,
    Digno de toda la adoración.
    Vestido en majestad, coronado con poder,
    Toda gloria y honra sean para Ti.

    Bridge:
    Grande y fuerte es nuestro Dios,
    Grande y fuerte es nuestro Dios,
    Grande y fuerte es nuestro Dios.`,
    scores: {
      guitar: 'https://www.cifraclub.com.br/miel-san-marcos/grande-fuerte/',
      piano: 'https://www.cifraclub.com.br/miel-san-marcos/grande-fuerte/teclado.html',
      bass: 'https://www.cifraclub.com.br/miel-san-marcos/grande-fuerte/baixo.html',
      drums: 'https://www.songsterr.com/a/wsa/miel-san-marcos-grande-y-fuerte-drum-tab-s489012'
    },
    audioUrl: '/audio/8.mp3'
  },
  {
    id: '9',
    title: 'Hermoso Nombre',
    category: 'Adoración',
    author: 'Hillsong Worship',
    lyrics: `Verso 1:
    Tú fuiste el verbo en el principio, unigénito de Dios.
    El misterio de Tu gloria, revelado en Tu amor.

    Coro 1:
    ¡Cuán hermoso Su nombre es! ¡Cuán hermoso Su nombre es!
    El nombre de Jesús, mi Rey.
    ¡Cuán hermoso Su nombre es! Nada se iguala a Él.
    ¡Cuán hermoso Su nombre es! No hay otro nombre.

    Verso 2:
    Dejaste el cielo por salvarme, me viniste a rescatar.
    Mi transgresión Tú perdonaste, nada nos separará.

    Puente:
    La muerte venciste, el velo partiste, la tumba vacía ahora está.
    Los cielos declaran Tu gloria proclaman, resucitaste en majestad.
    Inigualable, incomparable, hoy y por siempre reinarás.
    Tuyo es el reino, Tuya es la gloria, Tuyo el poder y autoridad.

    Coro 3:
    ¡Cuán poderoso Su nombre es! ¡Cuán poderoso Su nombre es!
    El nombre de Jesús, mi Rey.
    ¡Cuán poderoso Su nombre es! Incomparable es Él.
    ¡Cuán poderoso Su nombre es! No hay otro nombre.`,
    scores: {
      guitar: 'https://www.cifraclub.com.br/hillsong-worship/what-a-beautiful-name/',
      piano: 'https://www.cifraclub.com.br/hillsong-worship/what-a-beautiful-name/teclado.html',
      bass: 'https://www.cifraclub.com.br/hillsong-worship/what-a-beautiful-name/baixo.html',
      drums: 'https://www.songsterr.com/a/wsa/hillsong-worship-what-a-beautiful-name-drum-tab-s490123'
    },
    audioUrl: '/audio/9.mp3'
  },
  {
    id: '10',
    title: 'Danzando',
    category: 'Alabanza',
    author: 'Gateway Worship',
    lyrics: `Verso 1:
    Tu palabra dice que aunque pase por el fuego no me quemaré,
    Y si paso por las aguas no me ahogaré.
    Aunque haya oscuridad con fe caminaré, pues Tú siempre vas conmigo.

    Verso 2:
    Tu palabra dice no hay justo que Tú hayas desamparado,
    Eres pan para el hambriento y necesitado.
    En mi mesa nunca, nunca ha faltado, Tú provees y no has fallado.

    Coro:
    Tu yugo es fácil, ligera es Tu carga,
    Te entrego mi vida y mi alabanza.
    Mi escudo, mi fuerza, mi seguridad, con Cristo camino y estoy
    Danzando en cada temporada, lanzando en cada temporada.

    Verso 3:
    Tu palabra dice que Tú oyes el clamor del quebrantado,
    Por Tu llaga en la cruz fuimos sanados.
    Sobre toda enfermedad Tú has ganado, y mi vida está en Tu mano.

    Puente:
    Sigo danzando, glorificando, en cada temporada Tú sigues obrando.
    Aunque ande en el valle de sombra... Danzo, danzo, danzo, danzo.
    No se apaga, no se apagará este ritmo, aunque venga contra mí el enemigo.
    Tus promesas siempre van conmigo... Danzo, danzo, danzo, danzo.`,
    scores: {
      guitar: 'https://www.cifraclub.com.br/gateway-worship/danzando/',
      piano: 'https://www.cifraclub.com.br/gateway-worship/danzando/teclado.html',
      bass: 'https://www.cifraclub.com.br/gateway-worship/danzando/baixo.html',
      drums: 'https://www.songsterr.com/a/wsa/gateway-worship-danzando-drum-tab-s501234'
    },
    audioUrl: '/audio/10.mp3'
  }
];
