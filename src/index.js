import './css/styles.css';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import 'notiflix/dist/notiflix-aio-3.2.6.min.js';
import axios from 'axios';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const galleryEl = document.querySelector('.gallery');
const formEl = document.querySelector('.search-form');
const guardEL = document.querySelector('.js-guard');

let imgSearch = '';
let page = 1;

// SimpleLightbox

const lightbox = new SimpleLightbox('.gallery a', {
  captionsData: 'alt',
  captionDelay: 250,
});

// СКРОЛ IntersectionObserver

let options = {
  root: null,
  rootMargin: '300px',
  threshold: 1.0,
};

let observer = new IntersectionObserver(onload, options);

function onload(entries, observer) {
  entries.forEach(entry => {
    console.log(entry);

    if (entry.isIntersecting) {
      page += 1;
      console.log(page);
      getUser(imgSearch, page)
        .then(data => {
          makeMarcup(data.hits);
          // getFlowingScroll();
          lightbox.refresh();
          if (page * data.hits.length >= data.totalHits) {
            observer.unobserve(guardEL);
            return Notify.failure(
              "We're sorry, but you've reached the end of search results."
            );
          }
        })
        .catch(error => {
          console.error(error);
        });
    }
  });
}

// САБМИТ ФОРМЫ

formEl.addEventListener('submit', onFormElSubmit);

function onFormElSubmit(evt) {
  evt.preventDefault();

  // // `отключтить   observer т.к. срабатывает после 2-го сабмита`;
  observer.unobserve(guardEL);

  page = 1;
  galleryEl.innerHTML = '';

  imgSearch = evt.currentTarget.elements.searchQuery.value;

  getUser(imgSearch)
    .then(data => {
      if (data.totalHits === 0 || !imgSearch) {
        return Notify.failure(
          'Sorry, there are no images matching your search query. Please try again.'
        );
      }
      Notify.success(`"Hooray! We found ${data.totalHits} images."`);

      makeMarcup(data.hits);
      // getFlowingScroll()
      lightbox.refresh();
      observer.observe(guardEL);
    })
    .catch(error => {
      console.error(error);
    });
}

// ПОЛУЧЕНИЕ ИНФОРМАЦИИ ОТ БЕКЭНДА

async function getUser(imgSearch, page = 1) {
  try {
    const BASE_URL =
      'https://pixabay.com/api/?key=33025622-104a63b9949010de5d5c4e66d';
    const KEY = '33025622-104a63b9949010de5d5c4e66d';
    const params = {
      key: KEY,
      page: page,
      per_page: 40,
      q: `${imgSearch}`,
      image_type: 'photo',
      orientation: 'horizontal',
      safesearch: true,
    };
    const headers = {
      'content-type': 'application/json',
    };
    const response = await axios.get(`${BASE_URL}`, { params, headers });

    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

// РАЗМЕТКА КАРТОЧЕК

function makeMarcup(arr) {
  const marcup = arr
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) =>
        `<div class="photo-card">
         <a href="${largeImageURL}"><img  class= "img" src="${webformatURL}" alt="${tags}"  width="280" loading="lazy" /></a>
        <div class="info">
          <p class="info-item">
            <b>Likes </b>  <br>${likes}  
          </p>
          <p class="info-item">
            <b>Views </b> <br> ${views}
          </p>
          <p class="info-item">
            <b>Comments </b>  <br> ${comments}
          </p>
          <p class="info-item">
            <b> Downloads</b>  <br> ${downloads}
        </div>
      </div>`
    )
    .join('');

  return galleryEl.insertAdjacentHTML('beforeend', marcup);
}

// ПЛАВНЫЙ СКРОЛ
function getFlowingScroll() {
  const { height: cardHeight } = document
    .querySelector('.gallery')
    .firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}
