import Vue from 'vue';
import Router from 'vue-router';
import Login from '@/components/Login';
import Doors from '@/components/Doors';

Vue.use(Router);

const router = new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      component: Login,
      beforeEnter: (to, from, next) => {
        if (localStorage.getItem('notkisi_auth') !== null) {
          next('/doors');
          return;
        }

        next();
      },
    },
    {
      path: '/logout',
      beforeEnter: (to, from, next) => {
        localStorage.removeItem('notkisi_auth');
        next('/');
      },
    },
    {
      path: '/doors',
      component: Doors,
    },
  ],
});

router.beforeEach((to, from, next) => {
  if (to.path === '/') {
    next();
    return;
  }

  if (localStorage.getItem('notkisi_auth') === null) {
    next('/');
  }

  next();
});

export default router;
