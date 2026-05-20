ActiveAdmin.register_page "Dashboard" do
  menu priority: 1, label: proc { I18n.t("active_admin.dashboard") }

  content title: proc { I18n.t("active_admin.dashboard") } do
    columns do
      column do
        panel "PolyMarket Admin" do
          ul do
            li link_to("Listings", admin_listings_path)
            li link_to("Users",    admin_users_path)
            li link_to("Reviews",  admin_reviews_path)
          end
        end
      end
    end
  end
end
