import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiTrendingUp, FiShield, FiGift, FiArrowRight } from 'react-icons/fi';
import { APP_NAME } from '../utils/constants';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 animate-fadeIn">
              Win Big with {APP_NAME}
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of winners in Pakistan's most trusted and transparent lucky draw platform
            </p>

            {!isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-xl transition-all"
                >
                  Get Started Free
                  <FiArrowRight className="ml-2" />
                </Link>
                <Link
                  to="/draws"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-indigo-600 font-medium rounded-xl border-2 border-indigo-600 hover:bg-indigo-50 transition-all"
                >
                  View Active Draws
                </Link>
              </div>
            ) : (
              <Link
                to={user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'}
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:shadow-xl transition-all"
              >
                Go to Dashboard
                <FiArrowRight className="ml-2" />
              </Link>
            )}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-700"></div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose {APP_NAME}?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 card-hover">
              <div className="w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                <FiShield className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                100% Transparent
              </h3>
              <p className="text-gray-600">
                Every draw is fair and transparent. All results are publicly verifiable and recorded.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-8 card-hover">
              <div className="w-14 h-14 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl flex items-center justify-center mb-4">
                <FiGift className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Amazing Prizes
              </h3>
              <p className="text-gray-600">
                Win cars, cash prizes, gadgets and more. Real prizes for real winners!
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 card-hover">
              <div className="w-14 h-14 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl flex items-center justify-center mb-4">
                <FiTrendingUp className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Referral Rewards
              </h3>
              <p className="text-gray-600">
                Earn points by referring friends. Use points to get discounts on tokens!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Win Amazing Prizes?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join now and participate in exciting lucky draws!
          </p>
          {!isAuthenticated && (
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-indigo-600 font-medium rounded-xl hover:shadow-xl transition-all"
            >
              Create Free Account
              <FiArrowRight className="ml-2" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;