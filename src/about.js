import { initInnerPage } from './innerPage.js';
import { initAboutShowcase } from './aboutShowcase.js';
import './aboutEditorial.css';

initInnerPage({ after: initAboutShowcase });
