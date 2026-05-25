# frozen_string_literal: true

ActiveAdmin.register_page 'Dashboard' do
  menu priority: 1, label: proc { I18n.t('active_admin.dashboard') }

  content title: proc { I18n.t('active_admin.dashboard') } do
    columns do
      column do
        panel 'PolyMarket Admin' do
          ul do
            li 'Listings administration is waiting for a domain model.'
            li 'Users administration is waiting for auth-service integration.'
            li 'Reviews administration is waiting for review-service integration.'
          end
        end
      end
    end
  end
end
