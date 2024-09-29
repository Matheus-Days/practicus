'use client';

import { Content } from '@prismicio/client';
import DepoimentoCard from '@/app/components/DepoimentoCard';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { useEffect } from 'react';
import Swiper from 'swiper';
import { IoArrowBack, IoArrowForward } from 'react-icons/io5';

type SecaoDepoimentosContentProps = {
  depoimentos: Content.DepoimentoDocument<string>[];
};

export default function SecaoDepoimentosContent({
  depoimentos
}: SecaoDepoimentosContentProps) {
  let swiper: Swiper | undefined;

  useEffect(() => {
    swiper = new Swiper('.swiper', {
      centeredSlides: true,
      hashNavigation: {
        watchState: true
      },
      loop: true,
      modules: [Navigation, Pagination],
      navigation: true,
      pagination: {
        el: '.swiper-pagination',
        clickable: true,

        type: 'custom',
        renderCustom: function (_, current, total) {
          var out = '';
          for (let i = 1; i < total + 1; i++) {
            if (i == current) {
              out =
                out +
                '<span class="swiper-pagination-bullet swiper-pagination-bullet-active" tabindex=' +
                i +
                ' role="button" aria-label="Go to slide ' +
                i +
                1 +
                '"></span>';
            } else {
              out =
                out +
                '<span class="swiper-pagination-bullet" tabindex=' +
                i +
                ' role="button" aria-label="Go to slide ' +
                i +
                1 +
                '"></span>';
            }
          }
          return out;
        }
      },
      spaceBetween: 24,
      slidesPerView: 1,
      breakpoints: {
        768: {
          slidesPerView: 3
        }
      }
    });
  }, []);

  return (
    <div className="flex items-center w-full gap-6">
      <button
        className="p-3 mb-5 hidden md:block"
        onClick={() => swiper?.slidePrev()}
      >
        <IoArrowBack className="size-12" />
      </button>
      <div className="swiper custom">
        <div className="swiper-wrapper">
          {depoimentos.map((dep, i) => (
            <div key={dep.uid + i} className="swiper-slide">
              <DepoimentoCard depoimento={dep} />
            </div>
          ))}
        </div>
        <div className="swiper-pagination"></div>
      </div>
      <button
        className="p-3 mb-5 hidden md:block"
        onClick={() => swiper?.slideNext()}
      >
        <IoArrowForward className="size-12" />
      </button>
    </div>
  );
}
