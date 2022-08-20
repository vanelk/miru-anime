import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
    {
        path: '/',
        name: 'home',
        component: HomeView
    },
    {
        path: '/tv',
        name: 'tv',
        component:  () => import('../views/TVView.vue')
    },
    {
        path: '/movies',
        name: 'movies',
        component:  () => import('../views/MoviesView.vue')
    },
    {
        path: '/my-list',
        name: 'my list',
        component: () => import('../views/MyListView.vue')
    },
    {
        path: '/details/:animeId',
        name: 'details',
        component: () => import('../views/DetailsView.vue')
    },
    {
        path: '/watch/:watchId',
        name: 'watch',
        component: () => import('../views/WatchView.vue')
    }
]

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
})

export default router